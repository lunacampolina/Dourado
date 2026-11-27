import { useEffect, useState } from "react";
import type { Reserva, Sala } from "@salas/tipos";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
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

const formatarHora = (h: number) => `${String(h).padStart(2, "0")}:00`;

export function Relatorios() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [status, setStatus] = useState("todos");
  const [responsavel, setResponsavel] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listarSalas(), api.listarReservas({})])
      .then(([listaSalas, listaReservas]) => {
        setSalas(listaSalas);
        setReservas(listaReservas);
      })
      .catch((err) =>
        setErro(
          err instanceof Error ? err.message : "Erro ao carregar relatórios."
        )
      );
  }, []);

  const resumoPorSala = salas.map((sala) => {
    const daSala = reservas.filter((r) => r.salaId === sala.id);
    const ativas = daSala.filter((r) => r.status === "ativa").length;
    const canceladas = daSala.filter((r) => r.status === "cancelada").length;
    return {
      ...sala,
      total: daSala.length,
      ativas,
      canceladas,
    };
  });

  const historicoFiltrado = reservas.filter((r) => {
    const bateStatus = status === "todos" || r.status === status;
    const bateNome =
      !responsavel.trim() ||
      r.nomeResponsavel
        .toLowerCase()
        .includes(responsavel.trim().toLowerCase());
    return bateStatus && bateNome;
  });

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <span className="page-kicker">ANÁLISE / UTILIZAÇÃO</span>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Relatórios
        </h1>
        <p className="text-sm text-neutral-500">
          Ocupação consolidada por sala e histórico completo de reservas.
        </p>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* Ocupação por sala */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Ocupação por sala
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sala</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead>Ativas</TableHead>
                <TableHead>Canceladas</TableHead>
                <TableHead>Total de registros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumoPorSala.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell>{item.capacidade} lugares</TableCell>
                  <TableCell className="font-medium text-emerald-700">
                    {item.ativas}
                  </TableCell>
                  <TableCell className="font-medium text-red-600">
                    {item.canceladas}
                  </TableCell>
                  <TableCell className="font-semibold">{item.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Histórico filtrado */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <CardTitle className="text-base font-semibold">
            Histórico de reservas ({historicoFiltrado.length})
          </CardTitle>

          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label htmlFor="rel-nome" className="text-xs">
                Responsável
              </Label>
              <Input
                id="rel-nome"
                placeholder="Filtrar por nome..."
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                className="w-52"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="rel-status" className="text-xs">
                Status
              </Label>
              <select
                id="rel-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm"
              >
                <option value="todos">Todos</option>
                <option value="ativa">Ativas</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {historicoFiltrado.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-500">
              Nenhum registro encontrado.
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicoFiltrado.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.data.split("-").reverse().join("/")}</TableCell>
                    <TableCell>
                      {formatarHora(r.horaInicio)} –{" "}
                      {formatarHora(r.horaInicio + 1)}
                    </TableCell>
                    <TableCell>{r.salaNome}</TableCell>
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