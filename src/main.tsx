import React, { FormEvent, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, Boxes, CheckCircle2, KeyRound, Truck, UserRoundPlus } from "lucide-react";
import { createCustomer, createVehicle, getCustomers, getVehicles, login, SimpleOption } from "./frappe";
import { DispatchApp } from "./App";
import "./styles.css";

type ApiResult = {
  title: string;
  body: Record<string, unknown>;
};

function useLookup(loader: (search?: string) => Promise<SimpleOption[]>) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<SimpleOption[]>([]);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(() => {
      loader(search)
        .then((result) => {
          if (alive) setItems(result);
        })
        .catch(() => {
          if (alive) setItems([]);
        });
    }, 180);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [loader, search]);

  return { search, setSearch, items };
}

function App() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const customers = useLookup(getCustomers);
  const vehicles = useLookup(getVehicles);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run("Session connected", () => login(String(form.get("username")), String(form.get("password"))));
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
    customers.setSearch(String(form.get("customer")));
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
    vehicles.setSearch(String(form.get("vehicle")));
  }

  async function run(title: string, action: () => Promise<Record<string, unknown>>) {
    setBusy(true);
    setError("");
    try {
      const body = await action();
      setResult({ title, body });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="stamp">GT.DIGIGALAXY.CLOUD</div>
        <div>
          <p className="eyebrow">Tenant onboarding console</p>
          <h1>Fast desk for customers, vehicles, and local load readiness.</h1>
          <p className="lede">
            Simple labels in the React app, real Frappe records behind the curtain: Commodity Customer,
            Vehicle Owner, Driver, and Transport Vehicle stay linked in the backend.
          </p>
        </div>
        <div className="route-card" aria-label="Route preview">
          <span>Lahore</span>
          <ArrowRight aria-hidden="true" />
          <span>Karachi</span>
        </div>
      </section>

      <section className="panel-grid">
        <form className="panel login-panel" onSubmit={submitLogin}>
          <div className="panel-title">
            <KeyRound />
            <div>
              <p>Step 01</p>
              <h2>Backend Login</h2>
            </div>
          </div>
          <label>
            User
            <input name="username" placeholder="Administrator or tenant user" required />
          </label>
          <label>
            Password
            <input name="password" placeholder="Frappe password" type="password" required />
          </label>
          <button disabled={busy}>Connect Session</button>
        </form>

        <form className="panel" onSubmit={submitCustomer}>
          <div className="panel-title">
            <UserRoundPlus />
            <div>
              <p>Step 02</p>
              <h2>Create Customer</h2>
            </div>
          </div>
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

        <form className="panel" onSubmit={submitVehicle}>
          <div className="panel-title">
            <Truck />
            <div>
              <p>Step 03</p>
              <h2>Create Vehicle</h2>
            </div>
          </div>
          <label>
            Vehicle
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

        <section className="panel lookup-panel">
          <div className="panel-title">
            <Boxes />
            <div>
              <p>Live backend</p>
              <h2>Simple Selectors</h2>
            </div>
          </div>
          <label>
            Search Customers
            <input value={customers.search} onChange={(event) => customers.setSearch(event.target.value)} />
          </label>
          <OptionList items={customers.items} empty="No matching customers yet" />
          <label>
            Search Vehicles
            <input value={vehicles.search} onChange={(event) => vehicles.setSearch(event.target.value)} />
          </label>
          <OptionList items={vehicles.items} empty="No matching vehicles yet" />
        </section>
      </section>

      {(result || error) && (
        <aside className={`result ${error ? "is-error" : ""}`}>
          {error ? <strong>Request failed</strong> : <strong>{result?.title}</strong>}
          <pre>{error || JSON.stringify(result?.body, null, 2)}</pre>
        </aside>
      )}

      <footer>
        <CheckCircle2 />
        <span>Backend target: gt.digigalaxy.cloud only. The old goods.localhost site is not used.</span>
      </footer>
    </main>
  );
}

function OptionList({ items, empty }: { items: SimpleOption[]; empty: string }) {
  if (!items.length) {
    return <p className="empty">{empty}</p>;
  }

  return (
    <div className="option-list">
      {items.map((item) => (
        <div className="option" key={item.id}>
          <span>{item.label}</span>
          <code>{item.id}</code>
        </div>
      ))}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<DispatchApp />);
