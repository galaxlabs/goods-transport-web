# GT Dispatch Web

React + TypeScript + Vite frontend for the **Goods Transport** dispatch console.
Connects to the `goods_transport` Frappe app at `gt.digigalaxy.cloud`.

## Features

- Sidebar navigation with icon labels (Dashboard, Customers, Vehicles, Loads, Map Board)
- Dashboard with live metric cards, bar charts, and activity timeline
- Create/list views for Customers, Vehicles, and Transport Loads
- Fleet map board with real-time vehicle pin positions
- Toast notifications for all backend operations
- Session login with connected-user display in sidebar and topbar
- Status badges with colour coding across all list views
- Fully responsive — collapses to hamburger sidebar on mobile

## Setup

```bash
cp .env.example .env        # set VITE_FRAPPE_URL if needed
npm install
npm run dev                 # starts on :3004
```

For secure token-based calls in production, configure server env variables (not `VITE_`) in your host (for example Vercel project settings).

## Environment

| Variable | Default | Description |
|---|---|---|
| `VITE_FRAPPE_URL` | `https://gt.digigalaxy.cloud` | Frappe backend URL |
| `FRAPPE_BASE_URL` | `https://gt.digigalaxy.cloud` | Server-side proxy target base URL |
| `FRAPPE_API_KEY` | _(unset)_ | Server-side Frappe API key |
| `FRAPPE_API_SECRET` | _(unset)_ | Server-side Frappe API secret |

> `VITE_*` variables are public in browser bundles. Never place `FRAPPE_API_SECRET` in client env files.

## Secure proxy route

This project includes a server proxy route at `/api/frappe/*`:

- Route file: `api/frappe/[...path].ts`
- Frontend continues calling `/api/frappe/...`
- Proxy forwards to `${FRAPPE_BASE_URL}/api/...`
- If `FRAPPE_API_KEY` + `FRAPPE_API_SECRET` are set, proxy injects `Authorization: token key:secret`
- If token vars are not set, proxy forwards browser cookies for session login flow

## Backend

Requires the [`goods_transport`](https://github.com/galaxlabs/goods_transport) Frappe app installed and migrated on the target site.

## Deploy

```bash
npm run build   # outputs to dist/
```

A `vercel.json` is included for Vite SPA rewrites, and Vercel will serve `api/frappe/[...path].ts` as the secure backend proxy.

## License

MIT
# goods-transport-web
