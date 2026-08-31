# NVCCZ Matanho domains (NTS prod HTTPS)

Prod-only on NTS (`31.220.82.129`), behind Traefik + Let's Encrypt (TLS-ALPN on :443).

## Hostnames

| Role | Hostname |
|------|----------|
| Staff | `https://matanho.nvccz.com` |
| LP | `https://matanho-lp.nvccz.com` |
| Investee | `https://matanho-investee.nvccz.com` |
| Apply (public funding form) | `https://matanho-apply.nvccz.com` |
| API | `https://matanho-api.nvccz.com` |

## Why GoDaddy DNS for `nvccz.com` does nothing

`nvccz.com` is **not** using GoDaddy nameservers.

Authoritative NS today:

- `ns1.server-620376.nvccz.com`
- `ns2.server-620376.nvccz.com`

Apex currently resolves to `50.6.169.201` (old hosting). Editing A records in the **GoDaddy DNS UI** for `nvccz.com` will **not** publish to the internet until nameservers are GoDaddy’s (`ns11`/`ns12.domaincontrol.com`) **or** you add the records in the panel that owns `server-620376` (typically cPanel / HostGator-style **Zone Editor**).

`matanho.com` **is** on GoDaddy (`ns11`/`ns12.domaincontrol.com`) — that is why https://matanho.com already works on `31.220.82.129`.

## Fix DNS (pick one)

### Option A — recommended: edit DNS where NS already points

1. Log into the hosting control panel for `nvccz.com` (cPanel / HostGator / whatever serves `server-620376`).
2. Open **Zone Editor** / DNS.
3. Add A records → `31.220.82.129`:

| Name / Host | Type | Value |
|-------------|------|-------|
| `matanho` | A | `31.220.82.129` |
| `matanho-lp` | A | `31.220.82.129` |
| `matanho-investee` | A | `31.220.82.129` |
| `matanho-apply` | A | `31.220.82.129` |
| `matanho-api` | A | `31.220.82.129` |

4. Wait a few minutes, then `nslookup matanho.nvccz.com 8.8.8.8` should show `31.220.82.129`.

### Option B — move DNS to GoDaddy first

1. In GoDaddy → nvccz.com → **Nameservers** → change to GoDaddy defaults (`ns11.domaincontrol.com` / `ns12.domaincontrol.com`).
2. Wait until NS propagates (can take hours).
3. Then add the four A records above in GoDaddy DNS.

Until DNS works, staff UI still works at `http://31.220.82.129:3200` (etc.). Let’s Encrypt will issue certs after public A records exist (may need ~1h after prior failed ACME attempts clear rate limits).

## Verify

```bash
nslookup matanho.nvccz.com 8.8.8.8
curl -fsSI https://matanho.nvccz.com/login
curl -fsS https://matanho-api.nvccz.com/health
```
