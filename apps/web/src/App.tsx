import { useState } from "react";
import { BarChart3, CalendarDays, DoorOpen, ExternalLink, LayoutDashboard } from "lucide-react";
import { Agenda } from "@/pages/Agenda";
import { Dashboard } from "@/pages/Dashboard";
import { Relatorios } from "@/pages/Relatorios";
import { Salas } from "@/pages/Salas";

type Pagina = "dashboard" | "agenda" | "salas" | "relatorios";
const ITENS_MENU = [
  { id: "dashboard", label: "Visão geral", icone: LayoutDashboard },
  { id: "agenda", label: "Agenda", icone: CalendarDays },
  { id: "salas", label: "Salas", icone: DoorOpen },
  { id: "relatorios", label: "Relatórios", icone: BarChart3 },
] as const;

export default function App() {
  const [pagina, setPagina] = useState<Pagina>("dashboard");
  const atual = ITENS_MENU.find(item => item.id === pagina)!;
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <div className="brand-mark"><img src="/favicon.svg" alt="" width="48" height="48" /></div>
          <div><p className="brand-name">Dourado<span>.</span></p><p className="brand-sub">GESTÃO DE ESPAÇOS</p></div>
        </div>
        <div className="nav-label">MENU PRINCIPAL</div>
        <nav aria-label="Menu principal" className="app-nav">
          {ITENS_MENU.map(({ id, label, icone: Icone }) => (
            <button key={id} type="button" aria-current={pagina === id ? "page" : undefined} onClick={() => setPagina(id)}>
              <Icone size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-note"><span className="note-dot"/> Ambiente acadêmico</div><div className="sidebar-context">Organização de espaços<br/><small>Reservas de estudo · 1 hora</small></div>
          <a href="/docs" target="_blank" rel="noreferrer">Documentação da API <ExternalLink size={15}/></a>
        </div>
      </aside>
      <div className="app-workspace">
        <header className="app-topbar"><div className="breadcrumb">Gestão de espaços <span>/</span> <strong>{atual.label}</strong></div><div className="topbar-date"><CalendarDays size={16}/>{new Intl.DateTimeFormat('pt-BR', {day:'2-digit', month:'long', year:'numeric'}).format(new Date())}</div></header>
        <main className="app-main" data-page={pagina}>
          {pagina === "dashboard" && <Dashboard onAgenda={() => setPagina("agenda")} />}
          {pagina === "agenda" && <Agenda />}
          {pagina === "salas" && <Salas />}
          {pagina === "relatorios" && <Relatorios />}
          <footer className="app-footer">Dourado · Gestão de salas de estudo <span>Projeto acadêmico</span></footer>
        </main>
      </div>
    </div>
  );
}
