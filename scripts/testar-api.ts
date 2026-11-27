// Testes de aceitação da API. Execute com a API rodando (bun run dev:api):
//   bun run scripts/testar-api.ts              (usa uma data de teste livre)
//   bun run scripts/testar-api.ts 2031-03-10   (usa a data informada)
// Cada execução usa uma data nova por padrão, então pode ser repetida sem conflito.
// Os registros criados são cancelados ao final, preservando o histórico.

const BASE = process.env.API_URL ?? "http://localhost:3000";

function dataDeTeste(): string {
  const ano = 2030 + Math.floor(Math.random() * 10);
  const mes = 1 + Math.floor(Math.random() * 12);
  const dia = 1 + Math.floor(Math.random() * 28);
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

const DATA = process.argv[2] ?? dataDeTeste();
let falhas = 0;
const criadas: number[] = [];

async function req(metodo: string, caminho: string, corpo?: unknown, bruto?: string) {
  const res = await fetch(BASE + caminho, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: bruto ?? (corpo === undefined ? undefined : JSON.stringify(corpo)),
  });
  const json: any = await res.json().catch(() => null);
  return { status: res.status, json };
}

function verificar(id: string, descricao: string, obtido: unknown, esperado: unknown) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(
    `${ok ? "OK   " : "FALHA"} ${id.padEnd(4)} ${descricao}` +
      (ok ? "" : ` -> obtido=${JSON.stringify(obtido)} esperado=${JSON.stringify(esperado)}`)
  );
}

async function reservar(salaId: unknown, nomeResponsavel: string, horaInicio: unknown, data = DATA) {
  const r = await req("POST", "/api/reservas", { salaId, nomeResponsavel, data, horaInicio });
  if (r.status === 201) criadas.push(r.json.id);
  return r;
}

const salas = await req("GET", "/api/salas");
if (salas.status !== 200) {
  console.error(`API indisponível em ${BASE}. Execute bun run dev:api antes.`);
  process.exit(1);
}
const idDe = (nome: string) => salas.json.find((s: any) => s.nome === nome)?.id;
const s1 = idDe("Sala 1");
const s2 = idDe("Sala 2");
const s3 = idDe("Sala 3");
if (!s1 || !s2 || !s3) {
  console.error("Salas 1, 2 e 3 não encontradas. Reinicie a API para criar os dados iniciais.");
  process.exit(1);
}

console.log(`Data de teste: ${DATA}\n--- Roteiro obrigatório ---`);
const t01 = await reservar(s1, "Ana Silva", 14);
verificar("T01", "Reserva Sala 1 às 14h", t01.status, 201);
verificar("T02", "Duplicidade Sala 1 às 14h", (await reservar(s1, "Bruno Lima", 14)).status, 409);
const t03 = await reservar(s2, "Bruno Lima", 14);
verificar("T03", "Sala 2 no mesmo horário", t03.status, 201);
const t04 = await req("GET", `/api/reservas?salaId=${s1}&data=${DATA}`);
verificar("T04", "Filtro Sala 1 + data traz só a Sala 1", t04.json.map((r: any) => r.salaId), [s1]);
const t05 = await req("PATCH", `/api/reservas/${t01.json.id}/cancelar`);
verificar("T05", "Cancelar Ana Silva", [t05.status, t05.json?.status], [200, "cancelada"]);
const t06 = await reservar(s1, "Carla Souza", 14);
verificar("T06", "Horário da Sala 1 reutilizado após cancelamento", t06.status, 201);
const t07 = await req("GET", `/api/reservas?data=${DATA}`);
verificar(
  "T07",
  "Agenda da data: 2 ativas e 1 cancelada",
  [t07.json.filter((r: any) => r.status === "ativa").length, t07.json.filter((r: any) => r.status === "cancelada").length],
  [2, 1]
);
const t14 = await req("GET", `/api/reservas?data=${DATA}&status=cancelada`);
verificar("T14", "Filtro de canceladas traz só Ana Silva", t14.json.map((r: any) => r.nomeResponsavel), ["Ana Silva"]);

console.log("--- Validações complementares ---");
verificar("T08", "Sem nome do responsável", (await reservar(s3, "   ", 10)).status, 400);
verificar("T09a", "Hora 14.5", (await reservar(s3, "X", 14.5)).status, 400);
verificar("T09b", "Hora 24", (await reservar(s3, "X", 24)).status, 400);
verificar("T10a", "Data em formato 27/11/2026", (await req("POST", "/api/reservas", { salaId: s3, nomeResponsavel: "X", data: "27/11/2026", horaInicio: 10 })).status, 400);
verificar("T10b", "Data inexistente 2026-02-31", (await req("POST", "/api/reservas", { salaId: s3, nomeResponsavel: "X", data: "2026-02-31", horaInicio: 10 })).status, 400);
verificar("T11", "Sala inexistente", (await reservar(9999, "X", 10)).status, 404);
verificar("T12", "Sala com capacidade zero", (await req("POST", "/api/salas", { nome: "Sala Zero", capacidade: 0 })).status, 400);
verificar("T13", "Sala com nome já existente", (await req("POST", "/api/salas", { nome: "Sala 1", capacidade: 5 })).status, 409);
verificar("T15", "Cancelar reserva já cancelada", (await req("PATCH", `/api/reservas/${t05.json.id}/cancelar`)).status, 409);
verificar("T16", "Cancelar reserva inexistente", (await req("PATCH", "/api/reservas/99999/cancelar")).status, 404);

console.log("--- Tipos e limites ---");
verificar("T17", "Capacidade como texto \"6\" é rejeitada", (await req("POST", "/api/salas", { nome: "Sala Texto", capacidade: "6" })).status, 400);
verificar("T18", "Capacidade booleana é rejeitada", (await req("POST", "/api/salas", { nome: "Sala Bool", capacidade: true })).status, 400);
verificar("T19", "Capacidade decimal é rejeitada", (await req("POST", "/api/salas", { nome: "Sala Dec", capacidade: 2.5 })).status, 400);
verificar("T20", "Capacidade em texto na edição é rejeitada", (await req("PUT", `/api/salas/${s3}`, { nome: "Sala 3", capacidade: "4" })).status, 400);
verificar("T21", "Sala em texto na reserva é rejeitada", (await reservar(String(s3), "X", 10)).status, 400);
verificar("T22", "Hora em texto é rejeitada", (await reservar(s3, "X", "14")).status, 400);
verificar("T23", "JSON inválido é rejeitado", (await req("POST", "/api/reservas", undefined, "{ruim")).status, 400);
verificar("T24", "Hora 0 é aceita", (await reservar(s3, "Madrugada", 0)).status, 201);
verificar("T25", "Hora 23 é aceita", (await reservar(s3, "Noite", 23)).status, 201);
verificar("T26", "Filtro com sala não numérica", (await req("GET", "/api/reservas?salaId=abc")).status, 400);
verificar("T27", "Filtro com status inválido", (await req("GET", "/api/reservas?status=xpto")).status, 400);
verificar("T28", "Filtro com data inexistente", (await req("GET", "/api/reservas?data=2026-02-31")).status, 400);
verificar("T29", "Edição de sala com nome já usado", (await req("PUT", `/api/salas/${s3}`, { nome: "Sala 1", capacidade: 4 })).status, 409);
verificar("T30", "Edição de sala inexistente", (await req("PUT", "/api/salas/9999", { nome: "Fantasma", capacidade: 4 })).status, 404);
verificar("T31", "Rota desconhecida", (await req("GET", "/api/nada")).status, 404);

// Limpeza: cancela o que este teste criou, preservando o histórico.
for (const id of criadas) {
  await req("PATCH", `/api/reservas/${id}/cancelar`).catch(() => {});
}

console.log(falhas === 0 ? "\nTodos os testes passaram." : `\n${falhas} teste(s) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
