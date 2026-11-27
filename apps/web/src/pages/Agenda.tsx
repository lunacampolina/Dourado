import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Reserva, Sala } from "@salas/tipos";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const HORARIOS = Array.from({ length: 15 }, (_, i) => i + 8); // 08h às 22h
// Data local no formato AAAA-MM-DD (toISOString usaria UTC e erraria o dia à noite).
function dataLocal(): string {
  const n = new Date();
  const mm = String(n.getMonth() + 1).padStart(2, "0");
  const dd = String(n.getDate()).padStart(2, "0");
  return `${n.getFullYear()}-${mm}-${dd}`;
}
const formatarHora = (h: number) => `${String(h).padStart(2, "0")}:00`;

export function Agenda() {
  const hoje = dataLocal();

  const [salas, setSalas] = useState<Sala[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);

  // Filtros
  const [filtroSala, setFiltroSala] = useState("todas");
  const [filtroData, setFiltroData] = useState(hoje);
  const [filtroStatus, setFiltroStatus] = useState("todos");

  // Formulário de nova reserva
  const [salaId, setSalaId] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [data, setData] = useState(hoje);
  const [horaInicio, setHoraInicio] = useState(14);

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    try {
      const [listaSalas, listaReservas] = await Promise.all([
        api.listarSalas(),
        api.listarReservas({
          salaId: filtroSala,
          data: filtroData,
          status: filtroStatus,
        }),
      ]);
      setSalas(listaSalas);
      setReservas(listaReservas);
      if (!salaId && listaSalas.length > 0) {
        setSalaId(String(listaSalas[0].id));
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar agenda.");
    }
  }

  useEffect(() => {
    carregar();
  }, [filtroSala, filtroData, filtroStatus]);

  async function handleReservar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setEnviando(true);

    try {
      await api.criarReserva({
        salaId: Number(salaId),
        nomeResponsavel,
        data,
        horaInicio: Number(horaInicio),
      });
      setNomeResponsavel("");
      setSucesso("Reserva cadastrada com sucesso!");
      setFiltroData(data);
      await carregar();
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : "Não foi possível criar a reserva."
      );
    } finally {
      setEnviando(false);
    }
  }

  async function handleCancelar(id: number) {
    setErro(null);
    setSucesso(null);
    try {
      await api.cancelarReserva(id);
      setSucesso("Reserva cancelada. O horário voltou a ficar disponível!");
      await carregar();
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : "Erro ao cancelar a reserva."
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <span className="page-kicker">AGENDAMENTO / RESERVAS</span>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Agenda e Reservas
        </h1>
        <p className="text-sm text-neutral-500">
          Cadastre reservas de 1 hora em hora cheia, filtre a agenda ou cancele
          agendamentos.
        </p>
      </div>

      {/* Formulário de Nova Reserva */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Nova reserva</CardTitle>
          <p className="text-xs text-neutral-500">Selecione o espaço e um horário de uma hora.</p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleReservar}
            className="booking-form"
          >
            <div className="space-y-1.5">
              <Label htmlFor="sala">Sala</Label>
              <select
                id="sala"
                value={salaId}
                onChange={(e) => setSalaId(e.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                {salas.map((sala) => (
                  <option key={sala.id} value={sala.id}>
                    {sala.nome} ({sala.capacidade} lug.)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="responsavel">Responsável</Label>
              <Input
                id="responsavel"
                placeholder="Ex.: Lucas Silva"
                value={nomeResponsavel}
                onChange={(e) => setNomeResponsavel(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hora">Hora de início (1h)</Label>
              <select
                id="hora"
                value={horaInicio}
                onChange={(e) => setHoraInicio(Number(e.target.value))}
                className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                {HORARIOS.map((h) => (
                  <option key={h} value={h}>
                    {formatarHora(h)} – {formatarHora(h + 1)}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" disabled={enviando || salas.length === 0}>
              {enviando ? "Salvando..." : "Reservar sala"}
            </Button>
          </form>

          {erro && (
            <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro}
            </div>
          )}

          {sucesso && (
            <div role="status" className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {sucesso}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtros e Listagem da Agenda */}
      <Card>
        <CardHeader className="agenda-filter-header">
          <div>
            <CardTitle className="text-base font-semibold">
              Consultar agenda
            </CardTitle>
            <p className="text-xs text-neutral-500">{reservas.length} registro(s) encontrado(s)</p>
          </div>

          <div className="agenda-filters">
            <div className="space-y-1">
              <Label htmlFor="filtro-sala" className="text-xs">
                Sala
              </Label>
              <select
                id="filtro-sala"
                value={filtroSala}
                onChange={(e) => setFiltroSala(e.target.value)}
                className="flex h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm"
              >
                <option value="todas">Todas as salas</option>
                {salas.map((sala) => (
                  <option key={sala.id} value={sala.id}>
                    {sala.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filtro-data" className="text-xs">
                Data
              </Label>
              <Input
                id="filtro-data"
                type="date"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="w-40"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="filtro-status" className="text-xs">
                Status
              </Label>
              <select
                id="filtro-status"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="flex h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm"
              >
                <option value="todos">Todos</option>
                <option value="ativa">Ativas</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </div>

            {filtroData && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFiltroData("")}
              >
                Ver todas as datas
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {reservas.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-500">
              Nenhuma reserva encontrada para os filtros selecionados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Sala</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservas.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.data.split("-").reverse().join("/")}</TableCell>
                    <TableCell>
                      {formatarHora(r.horaInicio)} –{" "}
                      {formatarHora(r.horaInicio + 1)}
                    </TableCell>
                    <TableCell>
                      {r.salaNome}{" "}
                      <span className="text-xs text-neutral-400">
                        ({r.salaCapacidade} lug.)
                      </span>
                    </TableCell>
                    <TableCell>{r.nomeResponsavel}</TableCell>
                    <TableCell>
                      <Badge
                        variant={r.status === "ativa" ? "default" : "secondary"}
                        className={
                          r.status === "ativa"
                            ? "bg-emerald-600 hover:bg-emerald-600"
                            : "bg-red-100 text-red-700 hover:bg-red-100"
                        }
                      >
                        {r.status === "ativa" ? "Ativa" : "Cancelada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "ativa" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleCancelar(r.id)}
                        >
                          Cancelar
                        </Button>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}