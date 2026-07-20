import type {
  AuthState,
  Policial,
  Relatorio,
  RelatorioInput,
} from "../types";

const BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function authHeaders(): Record<string, string> {
  const raw = localStorage.getItem("csm_auth");
  if (!raw) return {};
  try {
    const auth: AuthState = JSON.parse(raw);
    return { Authorization: `Bearer ${auth.token}` };
  } catch {
    return {};
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = "Ocorreu um erro inesperado.";
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* corpo vazio */
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

export const api = {
  login: (email: string, senha: string) =>
    request<AuthState>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    }),

  listarPoliciais: () => request<Policial[]>("/api/policiais"),

  criarPolicial: (data: { nome_completo: string; nome_guerra: string; matricula: string }) =>
    request<Policial>("/api/policiais", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  removerPolicial: (id: number) =>
    request<void>(`/api/policiais/${id}`, { method: "DELETE" }),

  listarRelatorios: (filtros: { data?: string; pelotao?: string }) => {
    const params = new URLSearchParams();
    if (filtros.data) params.set("data", filtros.data);
    if (filtros.pelotao) params.set("pelotao", filtros.pelotao);
    const qs = params.toString();
    return request<Relatorio[]>(`/api/relatorios${qs ? `?${qs}` : ""}`);
  },

  criarRelatorio: (data: RelatorioInput) =>
    request<Relatorio>("/api/relatorios", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export { ApiError };
