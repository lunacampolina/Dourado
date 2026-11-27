import { useEffect, useState } from "react";
import type { ResumoDashboard } from "@salas/tipos";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CalendarCheck, CalendarClock, Users } from "lucide-react";

export function Dashboard({ onAgenda }: { onAgenda: () => void }) {
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api
      .dashboard()
      .then(setResumo)
      .catch((err) =>
        setErro(err instanceof Error ? err.message : "Erro ao carregar dashboard")
      );
  }, []);

  if (erro) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {erro}
      </div>
    );
  }

  if (!resumo) {
    return <p className="text-sm text-neutral-500">Carregando indicadores...</p>;
  }

  const totalGeral = resumo.reservasAtivas + resumo.reservasCanceladas;
  const pctAtivas =
    totalGeral > 0 ? Math.round((resumo.reservasAtivas / totalGeral) * 100) : 0;
  const pctCanceladas = totalGeral > 0 ? 100 - pctAtivas : 0;

  const maxPorData = Math.max(...resumo.porData.map((d) => d.total), 1);
  const maxRanking = Math.max(...resumo.rankingSalas.map((s) => s.total), 1);

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <span className="page-kicker">GESTÃO / VISÃO GERAL</span>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Visão geral
        </h1>
        <p className="text-sm text-neutral-500">
          Acompanhe a disponibilidade dos espaços e suas reservas.
        </p>
      </div>

      <section className="dashboard-hero">
        <div className="hero-copy"><span className="hero-kicker">ESPAÇOS QUE CONECTAM</span>
        <h2>Mais espaço para<br/> grandes ideias.</h2>
        <p>Gerencie as salas, organize horários e acompanhe suas reservas em um único lugar.</p>
        <button type="button" onClick={onAgenda} className="hero-action">Nova reserva <span aria-hidden="true">↗</span></button></div>
        <svg className="hero-art" viewBox="0 0 340 230" fill="none" aria-hidden="true"><g stroke="#e8bf78" strokeWidth="1.2"><path d="M80 190V43l99-31 99 31v147l-99 29Z"/><path d="M80 43l99 31 99-31M179 74v145M102 183V71l55 17v111M201 199V88l55-17v112"/><path d="M43 176l137 42 137-42M43 150l37-12m198 0 39 12M102 120l55 17m44 0 55-17"/><circle cx="179" cy="115" r="96" strokeDasharray="3 9" opacity=".5"/></g><circle cx="179" cy="74" r="5" fill="#f6d79b"/><circle cx="278" cy="43" r="4" fill="#f6d79b"/></svg>
      </section>
      <div className="section-heading"><h2>Indicadores de utilização</h2><span>Resumo atualizado ao abrir o painel</span></div>
      {/* Faixa 1: 4 cards de totais */}
      <div className="metric-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Salas cadastradas
            </CardTitle>
            <Building2 className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{resumo.totalSalas}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Capacidade total (lugares)
            </CardTitle>
            <Users className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{resumo.capacidadeTotal}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Reservas ativas
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{resumo.reservasAtivas}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Reservas hoje
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{resumo.reservasHoje}</p>
          </CardContent>
        </Card>
      </div>

      {/* Faixa 2: Taxa de confirmação e situação das reservas */}
      <div className="analytics-grid grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Taxa de confirmação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold">{resumo.taxaConfirmacao}%</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${resumo.taxaConfirmacao}%` }}
              />
            </div>
            <p className="text-xs text-neutral-500">
              Percentual de reservas que permanecem ativas em relação ao total
              registrado.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Situação das reservas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutral-100">
              {pctAtivas > 0 && (
                <div
                  className="bg-emerald-500"
                  style={{ width: `${pctAtivas}%` }}
                />
              )}
              {pctCanceladas > 0 && (
                <div
                  className="bg-red-500"
                  style={{ width: `${pctCanceladas}%` }}
                />
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-neutral-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Ativas
                </span>
                <span className="font-semibold">{resumo.reservasAtivas}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-neutral-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Canceladas
                </span>
                <span className="font-semibold">{resumo.reservasCanceladas}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Faixa 3: Gráficos simples em Tailwind */}
      <div className="analytics-grid grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Próximas datas com reservas ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resumo.porData.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Nenhuma reserva ativa cadastrada ainda.
              </p>
            ) : (
              <div className="flex h-44 items-end gap-4 pt-4">
                {resumo.porData.map((item) => {
                  const altura = Math.max(
                    Math.round((item.total / maxPorData) * 100),
                    12
                  );
                  return (
                    <div
                      key={item.data}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <span className="text-xs font-medium text-neutral-700">
                        {item.total}
                      </span>
                      <div className="flex h-28 w-full items-end justify-center">
                        <div
                          className="w-10 rounded-t-md bg-neutral-800 transition-all"
                          style={{ height: `${altura}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-neutral-500">
                        {item.data.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Salas mais reservadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumo.rankingSalas.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Nenhuma sala cadastrada.
              </p>
            ) : (
              resumo.rankingSalas.map((sala) => {
                const largura =
                  sala.total > 0
                    ? Math.max(Math.round((sala.total / maxRanking) * 100), 8)
                    : 0;
                return (
                  <div key={sala.nome} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-neutral-700">
                        {sala.nome}
                      </span>
                      <span className="text-neutral-500">
                        {sala.total} {sala.total === 1 ? "reserva" : "reservas"}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-800 transition-all"
                        style={{ width: `${largura}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}