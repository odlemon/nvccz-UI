# Local MySQL (Contabo VPS offline)

Contabo `31.220.82.129` is unreachable. Dev uses a **local MySQL 8.4** instance.

## Connection (backend `.env`, gitignored)

```
DATABASE_URL="mysql://arcus_dev:localdev_arcus_2026@127.0.0.1:3306/arcus_dev?ssl-mode=DISABLED"
```

Contabo tunnel URL remains commented in the same file for when the VPS returns.

## Runtime

| Item | Value |
|---|---|
| MySQL | 8.4.9 at `C:\Program Files\MySQL\MySQL Server 8.4` |
| Data dir | `C:\mysql-local-data\data` |
| Config | `C:\mysql-local-data\my.ini` |
| Port | **3306** (not 3307) |
| DB / user | `arcus_dev` / `arcus_dev` / `localdev_arcus_2026` |
| Schema | `npx prisma db push` from `prisma/schema.prisma` (489 tables) |
| Seed | `npx ts-node --transpile-only prisma/seed.ts` |

## Start MySQL

```bat
scripts\start-local-mysql.bat
```

Or:

```bat
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file=C:\mysql-local-data\my.ini --console
```

## App logins (seeded)

- Email: `admin@nts.com`
- Password: `admin123`
- Also: `admin@nvccz.co.zw` / `admin123` (from `prisma/seed.ts`)

## Portfolio demo data

Contabo dump was **not** available. Recreated known working set:

```bat
npm run db:seed:portfolio-v11-local-demo
```

See also: `design-refs/vps-pending-migrations.md` (boolean `appliedToLocal` / `appliedToVps`).

## Verify (2026-08-27)

- BE connected: `Connected to MySQL database successfully` on :3009
- Login 200, `GET /api/applications?light=true` 200, `POST /api/roles` 201 + listed
