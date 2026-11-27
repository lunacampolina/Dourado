export type StatusReserva = "ativa" | "cancelada";
export interface Sala {
  id: number;
  nome: string;
  capacidade: number;
}
export interface NovaSalaDTO {
  nome: string;
  capacidade: number;
}
export interface Reserva {
  id: number;
  salaId: number;
  salaNome: string;
  salaCapacidade: number;
  nomeResponsavel: string;
  data: string;          // Formato YYYY-MM-DD
  horaInicio: number;    // Hora cheia inteira: 0 a 23 (ex.: 14 = 14:00)
  status: StatusReserva;
  criadoEm: string;
}
export interface NovaReservaDTO {
  salaId: number;
  nomeResponsavel: string;
  data: string;
  horaInicio: number;
}
export interface ResumoDashboard {
  totalSalas: number;
  capacidadeTotal: number;
  reservasAtivas: number;
  reservasCanceladas: number;
  reservasHoje: number;
  taxaConfirmacao: number;
  porData: { data: string; total: number }[];
  rankingSalas: { nome: string; total: number }[];
}