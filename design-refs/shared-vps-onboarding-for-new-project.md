# Onboarding a new project onto the shared NTS VPS

**Purpose:** hand this to an agent or contractor working on a *different* project that needs to share
the same physical server as Arcus/NVCCZ. Read section 3 (what NOT to touch) before doing anything else —
this box already runs live client traffic for other products.

**One thing this file deliberately does not contain: the actual root password.** See §1 for why and
where to get it. Everything else needed to deploy safely is here.

---

## 1. Server access

| | |
|---|---|
| Host | `31.220.82.129` (NTS shared VPS) |
| SSH user | `root` |
| SSH password | **Not printed here on purpose** — this project's own handbook (`agent-operations-and-deployment-handbook.md`, §10) redacts it the same way, specifically because an earlier doc that pasted it in plaintext got flagged as a mistake not to repeat. Copy the current value yourself from `nvccz-new/.secrets/ssh.env` (or `nvccz-new/scripts/_ssh_creds.py`, which imports it) into wherever your new project needs it. **Do not create a fourth plaintext copy of it in a new file/repo** — one canonical place makes rotation possible; scattering it doesn't. |
| Connect | `ssh root@31.220.82.129`, or programmatically via Python + Paramiko (the pattern every deploy script here uses — `paramiko.SSHClient()`, `AutoAddPolicy()`, `connect(..., look_for_keys=False, allow_agent=False)`) |

Rotate the password after onboarding anyone new to it.

## 2. GitHub

| Repo | Remote |
|---|---|
| Frontend (this repo) | `https://github.com/odlemon/nvccz-UI.git` |
| Backend | `https://github.com/odlemon/nvccz.git` |

Convention used across both repos for feature work: cut `feature/<thing>-live` off `dev` (frontend) /
`master` (backend), merge back into `dev`/`master` and — for anything that should reach the NTS staging
stack — `prod`. A new, unrelated project doesn't need to follow this exact naming, but **do not push
directly to `dev`/`master`/`prod` on nvccz-new or nvccz** — those are this project's branches, not
shared infrastructure branches; nothing about sharing the VPS means sharing the repos.

## 3. What's already on this box — do not disturb

This is a **32 GB, no-swap** machine running live traffic for multiple unrelated products. Before doing
anything, know what's already here:

```text
/var/www/projects/arcus/      Arcus dev + demo stacks (this org's own product)
/var/www/projects/nvccz/      NVCCZ prod staging (this org's own product, real client)
/var/www/projects/matanho/    Matanho marketing/ERP site (separate product, same box)
/var/www/projects/lms-app/lms/  Hosts the shared Traefik reverse proxy — LMS's own stack lives here too
```

**Hard rules, not suggestions:**

- **One Docker build at a time on this box.** It has no swap; two builds running together have
  OOM-killed other people's containers before (specifically `lms-face-match`). If you're about to run
  a `docker compose ... --build`, check nobody else's build is mid-flight first (`docker ps`, `top`, or
  just ask).
- **Never touch anything under `lms-*`** without asking first — it's not this project's stack.
- **Never run `docker compose down -v`** on a stack that isn't yours (or even one that is, without
  thinking twice) — the `-v` wipes the named volume, i.e. the database.
- **The shared Traefik instance (`lms-traefik`) is not yours to restart or reconfigure carelessly** —
  it fronts every HTTPS domain on the box, for every project. See §5 for how to add your service to it
  without touching its own config.

## 4. Directory + compose layout convention

Every project on this box follows the same shape — worth matching so the next person (or agent) can
find their way around yours the same way they can around Arcus/NVCCZ:

```text
/var/www/projects/<your-project>/
  compose/            docker-compose.dev.yml, docker-compose.prod.yml (or similar)
  secrets/            *.env files — generated/edited ON THE SERVER, never committed to git,
                       preserved across redeploys (a redeploy script should merge into these,
                       not overwrite them, so DB passwords etc. survive a rebuild)
  src/api/            backend tarball extract
  src/ui/             frontend tarball extract
```

## 5. Reverse proxy + SSL — one shared Traefik for the whole box

There's a single Traefik instance (`lms-traefik`) fronting every HTTPS domain on this server. You don't
run your own reverse proxy or request your own certs — you just label your container correctly and
Traefik picks it up automatically.

- Listens on `:443` / `:80`, issues Let's Encrypt certs via a certresolver named `le` (TLS-ALPN — no
  separate HTTP challenge webroot needed).
- Discovers routes from **Docker labels on your running container** — it talks to your container
  directly over a shared Docker network, not via the host-published port. The `ports:` mapping in your
  compose file is only useful for direct-IP debugging; it's not what makes HTTPS routing work.

**Minimal label set for a new service:**

```yaml
services:
  web:
    # ... your service ...
    networks:
      - default
      - lms_lms-network
    labels:
      - traefik.enable=true
      - traefik.docker.network=lms_lms-network
      - traefik.http.routers.<name>.rule=Host(`yourdomain.com`)
      - traefik.http.routers.<name>.entrypoints=websecure
      - traefik.http.routers.<name>.tls.certresolver=le
      - traefik.http.services.<name>.loadbalancer.server.port=<container_internal_port>

networks:
  lms_lms-network:
    external: true
```

Once the container's up with these labels and DNS for your domain already points at `31.220.82.129`,
Traefik requests and serves the cert automatically — nothing manual.

**Verify which cert is actually being served** (useful when something looks wrong):

```bash
echo | openssl s_client -connect 127.0.0.1:443 -servername yourdomain.com 2>/dev/null | openssl x509 -noout -subject -issuer -dates
```
`issuer=CN = TRAEFIK DEFAULT CERT` means Traefik has no live router for that host yet (container down,
label typo, or DNS not pointed here) — this is what shows up in a browser as
`NET::ERR_CERT_AUTHORITY_INVALID`. `issuer=... Let's Encrypt ...` means it's working.

## 6. Ports — check before you claim one

Ports already in use on `31.220.82.129` as of this writing (**always re-verify with `ss -ltn` before
picking a new one** — this list goes stale):

```text
22, 443                       SSH / Traefik HTTPS
3050, 3051                    Upload sidecars (Arcus dev, demo)
3110, 3120, 3130, 3140, 3150  Arcus dev portals
3200, 3209, 3210, 3220,
3230, 3240, 3250, 3260        NVCCZ prod portals + API + upload sidecar
3307, 3327                    MySQL VPS-local tunnel ports
6379                          Redis
8001-8003                     misc
```

Since Traefik doesn't need your host port at all (§5), the safe move is to bind your service to
whatever's free and just make sure Traefik's labels point at the container's *internal* port — a real
production incident here was two stacks colliding on the same host port (`3130`) even though Traefik
itself never needed it; the fix was just moving one service's host-port env var, no Traefik changes.

## 7. Deploy script shape (copy this pattern, don't reinvent it)

Every deploy script in this org's repos (`scripts/deploy-*.py`) follows the same shape, using Python +
Paramiko, no separate CI system:

1. Tarball the relevant repo(s) locally, excluding `node_modules`, `.next`, `.git`, `.env`.
2. SFTP the tarball to the VPS under `/var/www/projects/<your-project>/src/`.
3. SSH in and run a remote script that:
   - extracts the tarball
   - **merges** (doesn't overwrite) `secrets/*.env` — preserves DB passwords etc. across redeploys
   - runs `docker compose --env-file secrets/<env>.env -f compose/<file>.yml up -d --build`
   - runs a local health curl before declaring success
4. Streams remote output back over the SSH channel (`get_pty=True`, print stdout line by line) so you
   see the build progress instead of it happening silently.

Minimal health-check pattern to append to any deploy script:

```bash
curl -sS -o /tmp/health.json -w 'health:%{http_code}\n' http://127.0.0.1:<port>/api/health
cat /tmp/health.json
```

## 8. Other gotchas already hit on this box (don't relearn these the hard way)

- **`restart: unless-stopped` does not bring a container back after a manual `docker stop` /
  `compose stop`.** If something was intentionally stopped and never explicitly restarted, it stays
  down indefinitely — this caused a real outage where a site served Traefik's default self-signed cert
  because there was no live router while the container was down. Periodically check
  `docker ps -a` for `Exited` containers.
- Docker sometimes leaves a `docker-proxy` process bound to a host port after the container using it
  stops — if `docker ps` says a port is free but you still get `bind: address already in use`, check
  `ps aux | grep docker-proxy` and `ss -ltnp`.
- The Traefik ACME cert store (`acme.json`) currently lives under `/tmp` on this box — not durable. A
  host reboot could wipe issued certs and force re-issuance, risking Let's Encrypt rate limits (roughly
  1h cooldown after failures, weekly limits per domain). Not your problem to fix, but know it's a
  possible failure mode if certs suddenly go missing after a reboot.

## 9. Quick reference

```text
Host:            31.220.82.129
SSH user:        root
SSH password:    copy from nvccz-new/.secrets/ssh.env — do not paste it into a new file
Shared proxy:    lms-traefik (Docker network lms_lms-network, certresolver "le")
Existing stacks: /var/www/projects/{arcus,nvccz,matanho,lms-app}/
Build rule:      one docker build at a time — no swap on this box
Port check:      ss -ltn   (before assigning any new port)
Never:           docker compose down -v on a stack that isn't yours; touch lms-*; push to
                 nvccz-new/nvccz's dev/master/prod branches
```

---

*Compiled from `agent-operations-and-deployment-handbook.md` and `vps-access-and-ssl-reference.md` in
this repo — those two remain the source of truth for Arcus/NVCCZ-specific details (DNS, module
inventory, DB migrations); this file is the distilled, portable subset relevant to a different project
sharing the same physical server.*
