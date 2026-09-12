#!/usr/bin/env python3
"""Apply all edits to deploy/arcus/docker-compose.dev.yml for portal separation."""
import re

path = 'deploy/arcus/docker-compose.dev.yml'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Domain migrations
c = c.replace('Host(`dev.arcus.co.zw`)', 'Host(`dev.matanho.com`)')
c = c.replace('Host(`dev-api.arcus.co.zw`)', 'Host(`dev-api.matanho.com`)')
c = c.replace('Host(`lp.dev.arcus.co.zw`) || Host(`dev-lp.arcus.co.zw`)', 'Host(`dev.lp.matanho.com`)')
c = c.replace('Host(`investee.dev.arcus.co.zw`) || Host(`dev-investee.arcus.co.zw`)', 'Host(`dev.investee.matanho.com`)')
c = c.replace('Host(`apply.dev.arcus.co.zw`) || Host(`dev-apply.arcus.co.zw`)', 'Host(`dev.apply.matanho.com`)')

# 2. Add vendor/events portal URL build args to staff service
c = c.replace(
    'NEXT_PUBLIC_APPLY_PORTAL_URL: ${PUBLIC_APPLY_PORTAL_URL}',
    'NEXT_PUBLIC_APPLY_PORTAL_URL: ${PUBLIC_APPLY_PORTAL_URL}\n        NEXT_PUBLIC_VENDOR_PORTAL_URL: ${PUBLIC_VENDOR_PORTAL_URL}\n        NEXT_PUBLIC_EVENTS_PORTAL_URL: ${PUBLIC_EVENTS_PORTAL_URL}'
)

# 3. Add CORS middleware to API service
c = c.replace(
    '- traefik.http.routers.arcus-dev-api.tls.certresolver=le\n      - traefik.http.services.arcus-dev-api.loadbalancer.server.port=3009',
    '- traefik.http.routers.arcus-dev-api.tls.certresolver=le\n      - traefik.http.routers.arcus-dev-api.middlewares=arcus-dev-api-cors@docker\n      - traefik.http.middlewares.arcus-dev-api-cors.headers.accesscontrolallowmethods=GET,OPTIONS,PUT,POST,DELETE\n      - traefik.http.middlewares.arcus-dev-api-cors.headers.accesscontrolalloworiginlist=https://dev.matanho.com,https://dev.lp.matanho.com,https://dev.investee.matanho.com,https://dev.vendor.matanho.com,https://dev.events.matanho.com,https://dev.apply.matanho.com,https://dev-api.matanho.com\n      - traefik.http.middlewares.arcus-dev-api-cors.headers.accesscontrolmaxage=100\n      - traefik.http.middlewares.arcus-dev-api-cors.headers.addvaryheader=true\n      - traefik.http.middlewares.arcus-dev-api-cors.headers.accesscontrolallowcredentials=true\n      - traefik.http.middlewares.arcus-dev-api-cors.headers.accesscontrolallowheaders=*\n      - traefik.http.services.arcus-dev-api.loadbalancer.server.port=3009'
)

# 4. Insert vendor and events services BEFORE the volumes section
volumes_marker = '\nvolumes:\n'
idx = c.find(volumes_marker)
if idx == -1:
    print("ERROR: Could not find volumes section!")
    exit(1)

vendor_events_services = """
  ui-vendor:
    build:
      context: ../src/ui
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_BASE_URL: ${PUBLIC_API_BASE_URL}
        NEXT_PUBLIC_WS_URL: ${PUBLIC_WS_URL}
        NEXT_PUBLIC_PORTAL: vendor
    restart: unless-stopped
    depends_on:
      - api
    networks:
      - default
      - edge
    ports:
      - "3140:3000"
    environment:
      NODE_ENV: production
      PORT: "3000"
    labels:
      - traefik.enable=true
      - traefik.docker.network=lms_lms-network
      - traefik.http.routers.arcus-dev-ui-vendor.rule=Host(`dev.vendor.matanho.com`)
      - traefik.http.routers.arcus-dev-ui-vendor.entrypoints=websecure
      - traefik.http.routers.arcus-dev-ui-vendor.tls.certresolver=le
      - traefik.http.services.arcus-dev-ui-vendor.loadbalancer.server.port=3000

  ui-events:
    build:
      context: ../src/ui
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_BASE_URL: ${PUBLIC_API_BASE_URL}
        NEXT_PUBLIC_WS_URL: ${PUBLIC_WS_URL}
        NEXT_PUBLIC_PORTAL: events
    restart: unless-stopped
    depends_on:
      - api
    networks:
      - default
      - edge
    ports:
      - "3150:3000"
    environment:
      NODE_ENV: production
      PORT: "3000"
    labels:
      - traefik.enable=true
      - traefik.docker.network=lms_lms-network
      - traefik.http.routers.arcus-dev-ui-events.rule=Host(`dev.events.matanho.com`)
      - traefik.http.routers.arcus-dev-ui-events.entrypoints=websecure
      - traefik.http.routers.arcus-dev-ui-events.tls.certresolver=le
      - traefik.http.services.arcus-dev-ui-events.loadbalancer.server.port=3000
"""

c = c[:idx] + vendor_events_services + c[idx:]

# 5. Verify the result
assert 'volumes:' in c, "Missing volumes section"
assert 'arcus_dev_mysql' in c, "Missing volumes definition"
assert 'websecure' in c.split('dev.events.matanho.com')[-1][:200], "Events service truncated"
assert 'ui-vendor:' in c, "Missing ui-vendor service"
assert 'ui-events:' in c, "Missing ui-events service"
assert 'dev.matanho.com' in c, "Missing matanho staff domain"
assert 'dev-api.matanho.com' in c, "Missing matanho API domain"
assert 'dev.lp.matanho.com' in c, "Missing matanho LP domain"
assert 'dev.investee.matanho.com' in c, "Missing matanho investee domain"
assert 'dev.apply.matanho.com' in c, "Missing matanho apply domain"
assert 'dev.vendor.matanho.com' in c, "Missing matanho vendor domain"
assert 'dev.events.matanho.com' in c, "Missing matanho events domain"
assert 'PUBLIC_VENDOR_PORTAL_URL' in c, "Missing vendor portal URL build arg"
assert 'PUBLIC_EVENTS_PORTAL_URL' in c, "Missing events portal URL build arg"
assert 'arcus-dev-api-cors' in c, "Missing CORS middleware"

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

lines = c.split('\n')
print(f"SUCCESS: {len(lines)} lines written")
print(f"Last 5 lines:")
for line in lines[-5:]:
    print(f"  {line}")
