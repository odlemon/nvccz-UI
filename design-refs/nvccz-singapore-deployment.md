# NVCCZ on the Singapore server (207.180.234.151)

Docker deployment alongside the other projects on that host. The host nginx (ports 80/443) routes the hostnames in; every
container publishes to `127.0.0.1` only. Deploy with `scripts/deploy-nvccz-singapore-docker.py <stage>`
(`prep, upload, build, up, db, seed, nginx, certs, verify`; password via `NVCCZ_SSH_PASSWORD`).

| Hostname | Portal | Container port (localhost) |
|---|---|---|
| `nvfnvvcz.my.matanho.com` | Staff | 3200 |
| `lp.nvccz.online` | LP | 3210 |
| `investee.nvccz.online` | Investee | 3220 |
| `nvccz.online` (+ `www`) | Apply (public) | 3230 |
| `vendor.nvccz.online` | Vendor (public) | 3240 |
| `events.nvccz.online` | Events (public) | 3260 |
| `api.nvccz.online` | API, socket.io, media | 3209 |

## DNS records to change (GoDaddy, TTL is already 600 s)

Zone `nvccz.online` (nameservers `ns55/ns56.domaincontrol.com`) — change each A record from `102.217.49.126` to **`207.180.234.151`**:
`@`, `www`, `lp`, `investee`, `vendor`, `events`, `api`.

Zone `matanho.com` (nameservers `ns11/ns12.domaincontrol.com`) — A record **`nvfnvvcz.my`** → `207.180.234.151`.

No MX, TXT or CNAME records exist on `nvccz.online`, so nothing else needs preserving there.

## After DNS resolves

`python scripts/deploy-nvccz-singapore-docker.py certs` — issues one Let's Encrypt certificate per hostname with
`certbot --nginx` (HTTP-01 over port 80, same method the neighbouring sites on this host already use) and adds the
HTTP→HTTPS redirect. Hostnames that do not resolve to this server yet are skipped and reported. Renewal is handled by the
host's existing certbot timer.

## Operations

```
ssh root@207.180.234.151
cd /opt/nvccz
docker compose -p nvccz-sg --env-file secrets/prod.env -f compose/docker-compose.yml ps
```

An 8 GB swap file (`/swapfile-nvccz-swap`, swappiness 10) was added for the image builds because the host had none; it is
safe to leave in place.
