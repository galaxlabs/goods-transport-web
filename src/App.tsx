import React, { FormEvent, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  LogIn,
  MapPinned,
  Menu,
  Route,
  Search,
  Truck,
  UserRoundPlus,
  Wifi,
  WifiOff,
  X,
  XCircle,
} from "lucide-react";
import {
  ChartPoint,
  createCustomer,
  createLocalLoad,
  createVehicle,
  CustomerRow,
  DashboardSummary,
  FleetMap,
  getDashboard,
  getFleetMap,
  listCustomers,
  listLoads,
  listVehicles,
  LoadRow,
  login,
  VehicleRow,
} from "./frappe";

type Toast = { id: number; type: "success" | "error"; message: string };

type ActivePage = "dashboard" | "customers" | "vehicles" | "loads" | "map";

const NAV: Array<{ id: ActivePage; label: string; icon: React.ReactNode }> = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "customers", label: "Customers", icon: <UserRoundPlus size={18} /> },
  { id: "vehicles", label: "Vehicles", icon: <Truck size={18} /> },
  { id: "loads", label: "Loads", icon: <Route size={18} /> },
  { id: "map", label: "Map Board", icon: <MapPinned size={18} /> },
];

export function DispatchApp() {
  const [activePage, setActivePage] = useState<ActivePage>("dashboard");
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [search, setSearch] = useState("");
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [fleetMap, setFleetMap] = useState<FleetMap | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState("");

  function pushToast(type: "success" | "error", message: string) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }

  async function refreshData(query = search) {
    const [summary, customerRows, vehicleRows, loadRows, mapData] = await Promise.all([
      getDashboard(),
      listCustomers(query),
      listVehicles(query),
      listLoads(query),
      getFleetMap(),
    ]);
    setDashboard(summary);
    setCustomers(customerRows.rows);
    setVehicles(vehicleRows.rows);
    setLoads(loadRows.rows);
    setFleetMap(mapData);
  }

  useEffect(() => {
    refreshData("").catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshData(search).catch(() => undefined);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [search]);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const formEl = event.currentTarget;
    setBusy(true);
    try {
      const res = await login(String(form.get("username")), String(form.get("password")));
      if (res.full_name) setSessionUser(res.full_name);
      pushToast("success", `Connected as ${res.full_name || "user"}`);
      formEl.reset();
    } catch (caught) {
      pushToast("error", caught instanceof Error ? caught.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run("Customer created", () =>
      createCustomer({
        customer: String(form.get("customer")),
        mobile: String(form.get("mobile") || ""),
        city: String(form.get("city") || ""),
        address: String(form.get("address") || ""),
        email: String(form.get("email") || ""),
      }),
    );
    await refreshData(String(form.get("customer")));
  }

  async function submitVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run("Vehicle linked", () =>
      createVehicle({
        vehicle: String(form.get("vehicle")),
        owner: String(form.get("owner")),
        driver: String(form.get("driver") || ""),
        vehicle_type: String(form.get("vehicle_type") || "Truck"),
      }),
    );
    await refreshData(String(form.get("vehicle")));
  }

  async function submitLoad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run("Local load created", () =>
      createLocalLoad({
        origin_city: String(form.get("origin_city") || "Lahore"),
        destination_city: String(form.get("destination_city") || "Karachi"),
        bilty_no: String(form.get("bilty_no")),
        sender_name: String(form.get("sender_name")),
        receiver_name: String(form.get("receiver_name")),
        receiver_address: String(form.get("receiver_address") || ""),
        goods_description: String(form.get("goods_description") || ""),
        freight_amount: Number(form.get("freight_amount") || 0),
        payment_type: String(form.get("payment_type") || "Receiver Pay") as "Paid" | "Receiver Pay",
      }),
    );
    await refreshData(String(form.get("bilty_no")));
  }

  async function run(title: string, action: () => Promise<Record<string, unknown>>) {
    setBusy(true);
    try {
      await action();
      pushToast("success", title);
    } catch (caught) {
      pushToast("error", caught instanceof Error ? caught.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  const navigate = (page: ActivePage) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">GT</div>
          <div className="brand-text">
            <span className="brand-name">GT Dispatch</span>
            <span className="brand-sub">gt.digigalaxy.cloud</span>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            type="button"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Application pages">
          {NAV.map((page) => (
            <button
              key={page.id}
              className={`sidebar-item ${activePage === page.id ? "is-active" : ""}`}
              onClick={() => navigate(page.id)}
              type="button"
            >
              {page.icon}
              <span>{page.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sessionUser ? (
            <div className="session-connected">
              <Wifi size={14} />
              <div>
                <p>Connected as</p>
                <strong>{sessionUser}</strong>
              </div>
            </div>
          ) : (
            <form className="session-form" onSubmit={submitLogin}>
              <div className="session-disconnected">
                <WifiOff size={14} />
                <span>Not connected</span>
              </div>
              <input name="username" placeholder="Username" required autoComplete="username" />
              <input
                name="password"
                placeholder="Password"
                type="password"
                required
                autoComplete="current-password"
              />
              <button disabled={busy} type="submit">
                <LogIn size={14} />
                Connect
              </button>
            </form>
          )}
        </div>
      </aside>

      {/* ── App body ── */}
      <div className="app-body">
        <header className="topbar">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(true)}
            type="button"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="topbar-brand">
            <span className="topbar-mark">GT</span>
            <span className="topbar-name">Dispatch</span>
          </div>
          <label className="topbar-search">
            <Search size={15} aria-hidden="true" />
            <input
              aria-label="Search records"
              placeholder="Search customers, vehicles, loads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="topbar-session">
            {sessionUser ? (
              <span className="topbar-user">
                <Wifi size={13} />
                {sessionUser}
              </span>
            ) : (
              <span className="topbar-offline">
                <WifiOff size={13} />
                Offline
              </span>
            )}
          </div>
        </header>

        <main className="main-content">
          {activePage === "dashboard" && (
            <Dashboard dashboard={dashboard} vehicles={vehicles} loads={loads} />
          )}
          {activePage === "customers" && (
            <CustomersPage rows={customers} busy={busy} onSubmit={submitCustomer} />
          )}
          {activePage === "vehicles" && (
            <VehiclesPage rows={vehicles} busy={busy} onSubmit={submitVehicle} />
          )}
          {activePage === "loads" && (
            <LoadsPage rows={loads} busy={busy} onSubmit={submitLoad} />
          )}
          {activePage === "map" && <MapPage fleetMap={fleetMap} />}
        </main>

        <footer className="app-footer">
          <CheckCircle2 size={14} />
          <span>Backend: gt.digigalaxy.cloud — goods.localhost dropped.</span>
        </footer>
      </div>

      {/* ── Toast stack ── */}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */

function Dashboard({
  dashboard,
  vehicles,
  loads,
}: {
  dashboard: DashboardSummary | null;
  vehicles: VehicleRow[];
  loads: LoadRow[];
}) {
  const stats = dashboard?.stats || { customers: 0, vehicles: 0, loads: 0, available_vehicles: 0 };
  const totalFreight = loads.reduce((sum, row) => sum + Number(row.total_freight || 0), 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h2 className="page-title-text">Dashboard</h2>
            <p className="page-subtitle">Operations overview</p>
          </div>
        </div>
        <div className="route-badge">
          <span>Lahore</span>
          <ArrowRight size={13} />
          <span>Karachi</span>
        </div>
      </div>
      <div className="dashboard-grid">
        <Metric
          icon={<UserRoundPlus size={22} />}
          label="Customers"
          value={stats.customers}
          note="Sender + receiver master"
          color="yellow"
        />
        <Metric
          icon={<Truck size={22} />}
          label="Vehicles"
          value={stats.vehicles}
          note={`${stats.available_vehicles} available`}
          color="diesel"
        />
        <Metric
          icon={<ClipboardList size={22} />}
          label="Loads"
          value={stats.loads}
          note="Local and line-haul jobs"
          color="green"
        />
        <Metric
          icon={<Gauge size={22} />}
          label="Freight"
          value={`PKR ${totalFreight.toLocaleString()}`}
          note="Visible list total"
          color="blue"
        />
        <ChartPanel title="Vehicle Status" points={dashboard?.charts.vehicle_status || []} />
        <ChartPanel title="Load Status" points={dashboard?.charts.load_status || []} tone="dark" />
        <ChartPanel title="Customer Mix" points={dashboard?.charts.customer_type || []} />
        <ActivityPanel loads={loads} vehicles={vehicles} points={dashboard?.charts.recent_loads || []} />
      </div>
    </div>
  );
}

/* ─── Customers page ─────────────────────────────────────────────────────── */

function CustomersPage({
  rows,
  busy,
  onSubmit,
}: {
  rows: CustomerRow[];
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon">
            <UserRoundPlus size={20} />
          </div>
          <div>
            <h2 className="page-title-text">Customers</h2>
            <p className="page-subtitle">{rows.length} records</p>
          </div>
        </div>
      </div>
      <section className="workbench-grid">
        <form className="panel create-panel" onSubmit={onSubmit}>
          <PanelHeading icon={<UserRoundPlus />} kicker="Create" title="New Customer" />
          <label>
            Customer
            <input name="customer" placeholder="Sender or receiver name" required />
          </label>
          <div className="two-col">
            <label>
              Mobile
              <input name="mobile" placeholder="0300..." />
            </label>
            <label>
              City
              <input name="city" placeholder="Lahore" />
            </label>
          </div>
          <label>
            Email
            <input name="email" placeholder="customer@example.com" type="email" />
          </label>
          <label>
            Address
            <textarea name="address" placeholder="Receiver address, market, gate, etc." />
          </label>
          <button disabled={busy}>Create Customer</button>
        </form>
        <DataTable
          title="Customer List"
          rows={rows.map((row) => ({
            id: row.id,
            cells: [
              row.label,
              row.type || "—",
              row.mobile || "—",
              row.city || "—",
              <StatusBadge key="status" status={row.status || ""} />,
            ],
          }))}
          headers={["Name", "Type", "Mobile", "City", "Status"]}
        />
      </section>
    </div>
  );
}

/* ─── Vehicles page ──────────────────────────────────────────────────────── */

function VehiclesPage({
  rows,
  busy,
  onSubmit,
}: {
  rows: VehicleRow[];
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon">
            <Truck size={20} />
          </div>
          <div>
            <h2 className="page-title-text">Vehicles</h2>
            <p className="page-subtitle">{rows.length} records</p>
          </div>
        </div>
      </div>
      <section className="workbench-grid">
        <form className="panel create-panel" onSubmit={onSubmit}>
          <PanelHeading icon={<Truck />} kicker="Register" title="New Vehicle" />
          <label>
            Vehicle No.
            <input name="vehicle" placeholder="LES-1234" required />
          </label>
          <div className="two-col">
            <label>
              Owner
              <input name="owner" placeholder="Owner name" required />
            </label>
            <label>
              Driver
              <input name="driver" placeholder="Driver name" />
            </label>
          </div>
          <label>
            Vehicle Type
            <select name="vehicle_type" defaultValue="Truck">
              <option>Truck</option>
              <option>Trailer</option>
              <option>Mazda</option>
              <option>Pickup</option>
              <option>Container</option>
            </select>
          </label>
          <button disabled={busy}>Link Vehicle</button>
        </form>
        <DataTable
          title="Vehicle List"
          rows={rows.map((row) => ({
            id: row.id,
            cells: [
              row.label,
              row.type || "—",
              row.owner || "—",
              row.driver || "—",
              <StatusBadge key="status" status={row.status || ""} />,
            ],
          }))}
          headers={["Vehicle", "Type", "Owner", "Driver", "Status"]}
        />
      </section>
    </div>
  );
}

/* ─── Loads page ─────────────────────────────────────────────────────────── */

function LoadsPage({
  rows,
  busy,
  onSubmit,
}: {
  rows: LoadRow[];
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon">
            <Route size={20} />
          </div>
          <div>
            <h2 className="page-title-text">Loads</h2>
            <p className="page-subtitle">{rows.length} records</p>
          </div>
        </div>
      </div>
      <section className="workbench-grid">
        <form className="panel create-panel" onSubmit={onSubmit}>
          <PanelHeading icon={<Route />} kicker="Create" title="Local Load" />
          <div className="two-col">
            <label>
              Origin
              <input name="origin_city" placeholder="Lahore" defaultValue="Lahore" />
            </label>
            <label>
              Destination
              <input name="destination_city" placeholder="Karachi" defaultValue="Karachi" />
            </label>
          </div>
          <label>
            Bilty No
            <input name="bilty_no" placeholder="LHR-001" required />
          </label>
          <div className="two-col">
            <label>
              Sender
              <input name="sender_name" placeholder="Sender name" required />
            </label>
            <label>
              Receiver
              <input name="receiver_name" placeholder="Receiver name" required />
            </label>
          </div>
          <label>
            Receiver Address
            <textarea name="receiver_address" placeholder="Drop address" />
          </label>
          <div className="two-col">
            <label>
              Freight (PKR)
              <input name="freight_amount" min="0" placeholder="1200" type="number" />
            </label>
            <label>
              Payment
              <select name="payment_type" defaultValue="Receiver Pay">
                <option>Receiver Pay</option>
                <option>Paid</option>
              </select>
            </label>
          </div>
          <label>
            Goods
            <input name="goods_description" placeholder="Cotton, machinery, cartons..." />
          </label>
          <button disabled={busy}>Create Load</button>
        </form>
        <DataTable
          title="Load List"
          rows={rows.map((row) => ({
            id: row.id,
            cells: [
              row.label,
              row.origin_city && row.destination_city ? (
                <span className="route-text" key="route">
                  <span>{row.origin_city}</span>
                  <ArrowRight size={12} />
                  <span>{row.destination_city}</span>
                </span>
              ) : (
                "—"
              ),
              <StatusBadge key="status" status={row.status || ""} />,
              String(row.total_bilties || 0),
              `PKR ${Number(row.total_freight || 0).toLocaleString()}`,
            ],
          }))}
          headers={["Load", "Route", "Status", "Bilties", "Freight"]}
        />
      </section>
    </div>
  );
}

/* ─── Map page ───────────────────────────────────────────────────────────── */

function MapPage({ fleetMap }: { fleetMap: FleetMap | null }) {
  const vehicles = fleetMap?.vehicles || [];
  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon">
            <MapPinned size={20} />
          </div>
          <div>
            <h2 className="page-title-text">Map Board</h2>
            <p className="page-subtitle">{vehicles.length} vehicles tracked</p>
          </div>
        </div>
      </div>
      <section className="map-grid">
        <div className="panel map-panel">
          <PanelHeading icon={<MapPinned />} kicker="Fleet" title="Live Map" />
          <div className="map-canvas" role="img" aria-label="Vehicle map board">
            <div className="map-gridlines" />
            {vehicles.map((vehicle, index) => (
              <div
                className={`map-pin status-${(vehicle.status || "unknown").toLowerCase().replaceAll(" ", "-")}`}
                key={vehicle.id}
                style={{
                  left: `${18 + ((index * 23) % 68)}%`,
                  top: `${24 + ((index * 31) % 58)}%`,
                }}
                title={`${vehicle.label} ${vehicle.lat}, ${vehicle.lng}`}
              >
                <Truck size={15} />
                <span>{vehicle.label}</span>
              </div>
            ))}
            {!vehicles.length && (
              <div className="map-empty">
                <Truck size={30} />
                <span>No vehicles with coordinates yet</span>
              </div>
            )}
          </div>
        </div>
        <DataTable
          title="Fleet Vehicles"
          rows={vehicles.map((row) => ({
            id: row.id,
            cells: [
              row.label,
              <StatusBadge key="status" status={row.status || ""} />,
              row.driver || "—",
              String(row.lat),
              String(row.lng),
            ],
          }))}
          headers={["Vehicle", "Status", "Driver", "Lat", "Lng"]}
        />
      </section>
    </div>
  );
}

/* ─── Shared components ──────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  if (!status) return <span className="status-badge status-empty">—</span>;
  const slug = status.toLowerCase().replace(/\s+/g, "-");
  return <span className={`status-badge status-${slug}`}>{status}</span>;
}

function Metric({
  icon,
  label,
  value,
  note,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  note: string;
  color: "yellow" | "diesel" | "green" | "blue";
}) {
  return (
    <article className={`metric-card metric-${color}`}>
      <div className="metric-icon">{icon}</div>
      <p className="metric-label">{label}</p>
      <strong className="metric-value">{value}</strong>
      <span className="metric-note">{note}</span>
    </article>
  );
}

function ChartPanel({ title, points, tone }: { title: string; points: ChartPoint[]; tone?: "dark" }) {
  const max = Math.max(...points.map((p) => p.value), 1);
  return (
    <section className={`panel chart-panel ${tone === "dark" ? "dark-panel" : ""}`}>
      <PanelHeading icon={<BarChart3 />} kicker="Chart" title={title} />
      <div className="bar-chart">
        {points.length ? (
          points.map((point) => (
            <div className="bar-row" key={point.label}>
              <span>{point.label}</span>
              <div className="bar-track">
                <i className="bar-fill" style={{ width: `${Math.max(8, (point.value / max) * 100)}%` }} />
              </div>
              <strong>{point.value}</strong>
            </div>
          ))
        ) : (
          <p className="empty-msg">No chart data yet</p>
        )}
      </div>
    </section>
  );
}

function ActivityPanel({
  loads,
  vehicles,
  points,
}: {
  loads: LoadRow[];
  vehicles: VehicleRow[];
  points: ChartPoint[];
}) {
  return (
    <section className="panel activity-panel">
      <PanelHeading icon={<Activity />} kicker="Ops" title="Recent Activity" />
      <div className="mini-timeline">
        {points.slice(-4).map((point) => (
          <div className="timeline-row" key={point.label}>
            <span>{point.label}</span>
            <strong>{point.value} loads</strong>
            <em>PKR {Number(point.freight || 0).toLocaleString()}</em>
          </div>
        ))}
        {!points.length && <p className="empty-msg">No load activity yet</p>}
      </div>
      <div className="ops-strip">
        <span>{vehicles.length} vehicles in view</span>
        <span>{loads.length} loads in view</span>
      </div>
    </section>
  );
}

function DataTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: Array<{ id: string; cells: React.ReactNode[] }>;
}) {
  return (
    <section className="panel table-panel">
      <PanelHeading icon={<Boxes />} kicker="List View" title={title} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {row.cells.map((cell, index) => (
                  <td key={`${row.id}-${index}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="table-empty">No rows match this view yet.</p>}
      </div>
    </section>
  );
}

function PanelHeading({ icon, kicker, title }: { icon: React.ReactNode; kicker: string; title: string }) {
  return (
    <div className="panel-title">
      {icon}
      <div>
        <p>{kicker}</p>
        <h3>{title}</h3>
      </div>
    </div>
  );
}
