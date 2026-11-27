import type {
  NovaReservaDTO,
  NovaSalaDTO,
  Reserva,
  ResumoDashboard,
  Sala,
} from "@salas/tipos";

async function requisitar<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const dados = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(dados.erro || `Erro HTTP ${res.status}`);
  }
  return dados as T;
}

export const api = {
  listarSalas: (busca = "") =>
    requisitar<Sala[]>(
      `/api/salas${busca ? `?busca=${encodeURIComponent(busca)}` : ""}`
    ),

  criarSala: (body: NovaSalaDTO) =>
    requisitar<Sala>("/api/salas", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  atualizarSala: (id: number, body: NovaSalaDTO) =>
    requisitar<Sala>(`/api/salas/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  excluirSala: (id: number) =>
    requisitar<{ ok: boolean }>(`/api/salas/${id}`, {
      method: "DELETE",
    }),

  listarReservas: (filtros: {
    salaId?: string;
    data?: string;
    status?: string;
  }) => {
    const qs = new URLSearchParams();
    if (filtros.salaId && filtros.salaId !== "todas") {
      qs.set("salaId", filtros.salaId);
    }
    if (filtros.data) {
      qs.set("data", filtros.data);
    }
    if (filtros.status && filtros.status !== "todos") {
      qs.set("status", filtros.status);
    }
    return requisitar<Reserva[]>(`/api/reservas?${qs.toString()}`);
  },

  criarReserva: (body: NovaReservaDTO) =>
    requisitar<Reserva>("/api/reservas", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  cancelarReserva: (id: number) =>
    requisitar<Reserva>(`/api/reservas/${id}/cancelar`, {
      method: "PATCH",
    }),

  dashboard: () => requisitar<ResumoDashboard>("/api/dashboard"),
};