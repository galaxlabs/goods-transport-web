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

## Environment

| Variable | Default | Description |
|---|---|---|
| `VITE_FRAPPE_URL` | `https://gt.digigalaxy.cloud` | Frappe backend URL |

## Backend

Requires the [`goods_transport`](https://github.com/galaxlabs/goods_transport) Frappe app installed and migrated on the target site.

## Deploy

```bash
npm run build   # outputs to dist/
```

A `vercel.json` is included for one-click Vercel deploys with the API proxy rewrite.

## License

MIT
# goods-transport-web
