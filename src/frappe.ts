export type SimpleOption = {
  id: string;
  label: string;
};

export type CustomerResponse = {
  id: string;
  label: string;
  customer: string;
  doctype: "Commodity Customer";
  tenant: string;
  erpnext_customer?: string | null;
};

export type VehicleResponse = {
  id: string;
  label: string;
  vehicle: string;
  doctype: "Transport Vehicle";
  tenant: string;
  vehicle_owner: string;
  driver?: string | null;
};

export type ChartPoint = {
  label: string;
  value: number;
  freight?: number;
};

export type DashboardSummary = {
  stats: {
    customers: number;
    vehicles: number;
    loads: number;
    available_vehicles: number;
  };
  charts: {
    vehicle_status: ChartPoint[];
    customer_type: ChartPoint[];
    load_status: ChartPoint[];
    recent_loads: ChartPoint[];
  };
};

export type CustomerRow = {
  id: string;
  label: string;
  type?: string;
  mobile?: string;
  city?: string;
  status?: string;
  erpnext_customer?: string;
};

export type VehicleRow = {
  id: string;
  label: string;
  type?: string;
  owner?: string;
  driver?: string;
  status?: string;
  lat?: number;
  lng?: number;
};

export type LoadRow = {
  id: string;
  label: string;
  posting_date?: string;
  load_type?: string;
  origin_city?: string;
  destination_city?: string;
  vehicle?: string;
  driver?: string;
  status?: string;
  total_bilties?: number;
  total_freight?: number;
  receiver_pay_amount?: number;
  paid_amount?: number;
};

export type FleetMap = {
  center: {
    lat: number;
    lng: number;
    label: string;
  };
  vehicles: Array<VehicleRow & { lat: number; lng: number }>;
};

export type LoadResponse = {
  doctype: "Transport Load";
  name: string;
  tenant: string;
  total_bilties: number;
  total_freight: number;
  paid_amount: number;
  receiver_pay_amount: number;
};

export type ConnectionStatus = {
  reachable: boolean;
  authenticated: boolean;
  user: string | null;
  message: string;
};

const API_BASE = "https://gt.digigalaxy.cloud/api";

function extractServerMessage(payload: any, fallback: string): string {
  const raw = payload?._server_messages;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      const first = Array.isArray(parsed) ? parsed[0] : parsed;
      if (typeof first === "string") {
        try {
          const nested = JSON.parse(first);
          if (nested?.message && typeof nested.message === "string") {
            return nested.message.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          }
          return first;
        } catch {
          return first;
        }
      }
      if (first?.message && typeof first.message === "string") {
        return first.message.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
    } catch {
      // ignore and continue to fallback
    }
  }
  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  return fallback || "Frappe request failed";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.exc) {
    const message = extractServerMessage(payload, response.statusText);
    throw new Error(typeof message === "string" ? message : "Frappe request failed");
  }

  return payload.message ?? payload;
}

export async function login(username: string, password: string) {
  return request<{ home_page?: string; full_name?: string }>("/method/login", {
    method: "POST",
    body: JSON.stringify({ usr: username, pwd: password }),
  });
}

export async function createCustomer(data: {
  customer: string;
  mobile?: string;
  city?: string;
  address?: string;
  email?: string;
}) {
  return request<CustomerResponse>("/method/goods_transport.api.simple.create_customer", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createVehicle(data: {
  vehicle: string;
  owner: string;
  driver?: string;
  vehicle_type?: string;
}) {
  return request<VehicleResponse>("/method/goods_transport.api.simple.create_vehicle", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createLocalLoad(data: {
  origin_city: string;
  destination_city: string;
  bilty_no: string;
  sender_name: string;
  receiver_name: string;
  receiver_address?: string;
  goods_description?: string;
  freight_amount?: number;
  payment_type?: "Paid" | "Receiver Pay";
}) {
  return request<LoadResponse>("/method/goods_transport.api.onboarding.register_local_load", {
    method: "POST",
    body: JSON.stringify({
      origin_city: data.origin_city,
      destination_city: data.destination_city,
      bilties: [
        {
          bilty_no: data.bilty_no,
          sender_name: data.sender_name,
          receiver_name: data.receiver_name,
          receiver_address: data.receiver_address,
          goods_description: data.goods_description,
          freight_amount: data.freight_amount || 0,
          payment_type: data.payment_type || "Receiver Pay",
          sync_parties_to_erpnext: 0,
        },
      ],
    }),
  });
}

export async function getCustomers(search = "") {
  const params = new URLSearchParams({ search });
  return request<SimpleOption[]>(`/method/goods_transport.api.simple.get_customers?${params}`);
}

export async function getVehicles(search = "") {
  const params = new URLSearchParams({ search });
  return request<SimpleOption[]>(`/method/goods_transport.api.simple.get_vehicles?${params}`);
}

export async function getDashboard() {
  return request<DashboardSummary>("/method/goods_transport.api.simple.get_dashboard");
}

export async function listCustomers(search = "") {
  const params = new URLSearchParams({ search });
  return request<{ rows: CustomerRow[] }>(`/method/goods_transport.api.simple.list_customers?${params}`);
}

export async function listVehicles(search = "") {
  const params = new URLSearchParams({ search });
  return request<{ rows: VehicleRow[] }>(`/method/goods_transport.api.simple.list_vehicles?${params}`);
}

export async function listLoads(search = "") {
  const params = new URLSearchParams({ search });
  return request<{ rows: LoadRow[] }>(`/method/goods_transport.api.simple.list_loads?${params}`);
}

export async function getFleetMap() {
  return request<FleetMap>("/method/goods_transport.api.simple.get_fleet_map");
}

export async function getConnectionStatus(): Promise<ConnectionStatus> {
  try {
    await request<string>("/method/ping");

    let loggedUser = "Guest";
    try {
      loggedUser = await request<string>("/method/frappe.auth.get_logged_user");
    } catch {
      return {
        reachable: true,
        authenticated: false,
        user: null,
        message: "Backend reachable (session not authenticated)",
      };
    }

    const authenticated = Boolean(loggedUser && loggedUser !== "Guest");
    return {
      reachable: true,
      authenticated,
      user: authenticated ? loggedUser : null,
      message: authenticated
        ? `Backend reachable • Logged in as ${loggedUser}`
        : "Backend reachable • Guest session",
    };
  } catch (caught) {
    return {
      reachable: false,
      authenticated: false,
      user: null,
      message: caught instanceof Error ? caught.message : "Backend unreachable",
    };
  }
}
