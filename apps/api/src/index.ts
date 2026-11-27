import { db } from "./db";
import { openApiSpec } from "./openapi";
import type {
  NovaReservaDTO,
  NovaSalaDTO,
  Reserva,
  ResumoDashboard,
  Sala,
} from "@salas/tipos";

const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const STATUS_VALIDOS = ["ativa", "cancelada"];

// Número inteiro de verdade: rejeita texto ("6"), booleano, null e decimais.
const inteiro = (valor: unknown): number =>
  typeof valor === "number" && Number.isInteger(valor) ? valor : NaN;

// Confere se a data existe no calendário (ex.: rejeita 2026-02-31).
function dataValida(texto: string): boolean {
  if (!DATA_REGEX.test(texto)) return false;
  const [a, m, d] = texto.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  return (
    dt.getUTCFullYear() === a &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

// Data de hoje no fuso local do servidor, no formato AAAA-MM-DD.
function hojeLocal(): string {
  const n = new Date();
  const mm = String(n.getMonth() + 1).padStart(2, "0");
  const dd = String(n.getDate()).padStart(2, "0");
  return `${n.getFullYear()}-${mm}-${dd}`;
}

const scalarHtml = `<!doctype html>
<html>
  <head>
    <title>Docs API — Salas de Estudo</title>
    <meta charset="utf-8" />
  </head>
  <body>
    <script id="api-reference" data-url="/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

const buscarReservasSql = `
  SELECT r.id, r.sala_id AS salaId, s.nome AS salaNome,
         s.capacidade AS salaCapacidade, r.nome_responsavel AS nomeResponsavel,
         r.data, r.hora_inicio AS horaInicio, r.status, r.criado_em AS criadoEm
  FROM reservas r
  JOIN salas s ON s.id = r.sala_id
`;

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname, searchParams } = url;
    const method = req.method;

    // --- DOCUMENTAÇÃO INTERATIVA SCALAR ---
    if (method === "GET" && pathname === "/openapi.json") {
      return json(openApiSpec);
    }
    if (method === "GET" && pathname === "/docs") {
      return new Response(scalarHtml, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // --- SALAS ---
    if (method === "GET" && pathname === "/api/salas") {
      const busca = searchParams.get("busca")?.trim();
      const salas = busca
        ? (db
            .query(
              "SELECT id, nome, capacidade FROM salas WHERE nome LIKE ? ORDER BY nome"
            )
            .all(`%${busca}%`) as Sala[])
        : (db
            .query("SELECT id, nome, capacidade FROM salas ORDER BY nome")
            .all() as Sala[]);
      return json(salas);
    }

    if (method === "POST" && pathname === "/api/salas") {
      const body = (await req.json().catch(() => ({}))) as Partial<NovaSalaDTO>;
      const nome = typeof body.nome === "string" ? body.nome.trim() : "";
      const capacidade = inteiro(body.capacidade);

      if (!nome || !Number.isInteger(capacidade) || capacidade <= 0) {
        return json(
          { erro: "Informe nome válido e capacidade inteira maior que zero." },
          400
        );
      }

      try {
        const res = db
          .prepare("INSERT INTO salas (nome, capacidade) VALUES (?, ?)")
          .run(nome, capacidade);
        return json({ id: Number(res.lastInsertRowid), nome, capacidade }, 201);
      } catch (err) {
        if (String(err).includes("UNIQUE")) {
          return json({ erro: "Já existe uma sala com esse nome." }, 409);
        }
        console.error(err);
        return json({ erro: "Erro interno ao salvar a sala." }, 500);
      }
    }

    const salaMatch = pathname.match(/^\/api\/salas\/(\d+)$/);
    if (salaMatch) {
      const id = Number(salaMatch[1]);

      if (method === "PUT") {
        const body = (await req.json().catch(() => ({}))) as Partial<NovaSalaDTO>;
        const nome = typeof body.nome === "string" ? body.nome.trim() : "";
        const capacidade = inteiro(body.capacidade);

        if (!nome || !Number.isInteger(capacidade) || capacidade <= 0) {
          return json({ erro: "Dados inválidos para atualização da sala." }, 400);
        }

        try {
          const res = db
            .prepare("UPDATE salas SET nome = ?, capacidade = ? WHERE id = ?")
            .run(nome, capacidade, id);

          if (res.changes === 0) {
            return json({ erro: "Sala não encontrada." }, 404);
          }
          return json({ id, nome, capacidade });
        } catch (err) {
          if (String(err).includes("UNIQUE")) {
            return json({ erro: "Já existe outra sala com esse nome." }, 409);
          }
          console.error(err);
          return json({ erro: "Erro interno ao atualizar a sala." }, 500);
        }
      }

      if (method === "DELETE") {
        const res = db.prepare("DELETE FROM salas WHERE id = ?").run(id);
        if (res.changes === 0) {
          return json({ erro: "Sala não encontrada." }, 404);
        }
        return json({ ok: true });
      }
    }

    // --- RESERVAS ---
    if (method === "GET" && pathname === "/api/reservas") {
      const salaId = searchParams.get("salaId")?.trim();
      const data = searchParams.get("data")?.trim();
      const status = searchParams.get("status")?.trim();

      const condicoes: string[] = [];
      const params: (string | number)[] = [];

      if (salaId && salaId !== "todas") {
        const idSala = Number(salaId);
        if (!/^\d+$/.test(salaId) || !Number.isInteger(idSala) || idSala <= 0) {
          return json({ erro: "Informe uma sala válida." }, 400);
        }
        condicoes.push("r.sala_id = ?");
        params.push(idSala);
      }
      if (data) {
        if (!DATA_REGEX.test(data) || !dataValida(data)) {
          return json({ erro: "Informe a data no formato AAAA-MM-DD." }, 400);
        }
        condicoes.push("r.data = ?");
        params.push(data);
      }
      if (status && status !== "todos") {
        if (!STATUS_VALIDOS.includes(status)) {
          return json({ erro: "O status deve ser ativa, cancelada ou todos." }, 400);
        }
        condicoes.push("r.status = ?");
        params.push(status);
      }

      const where =
        condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";
      const sql = `${buscarReservasSql} ${where} ORDER BY r.data ASC, r.hora_inicio ASC`;
      const reservas = db.query(sql).all(...params) as Reserva[];

      return json(reservas);
    }

    if (method === "POST" && pathname === "/api/reservas") {
      const body = (await req.json().catch(() => ({}))) as Partial<NovaReservaDTO>;
      const salaId = inteiro(body.salaId);
      const nomeResponsavel =
        typeof body.nomeResponsavel === "string"
          ? body.nomeResponsavel.trim()
          : "";
      const data = typeof body.data === "string" ? body.data.trim() : "";
      const horaInicio = inteiro(body.horaInicio);

      if (!Number.isInteger(salaId) || salaId <= 0) {
        return json({ erro: "Informe uma sala válida." }, 400);
      }
      if (!nomeResponsavel) {
        return json({ erro: "Informe o nome de quem está reservando." }, 400);
      }
      if (!data || !DATA_REGEX.test(data)) {
        return json({ erro: "Informe a data no formato AAAA-MM-DD." }, 400);
      }
      if (!dataValida(data)) {
        return json({ erro: "A data informada não existe no calendário." }, 400);
      }
      if (!Number.isInteger(horaInicio) || horaInicio < 0 || horaInicio > 23) {
        return json(
          { erro: "A hora de início deve ser uma hora cheia entre 0 e 23." },
          400
        );
      }

      const salaExiste = db
        .query("SELECT id FROM salas WHERE id = ?")
        .get(salaId);
      if (!salaExiste) {
        return json({ erro: "Sala não encontrada." }, 404);
      }

      try {
        const res = db
          .prepare(
            "INSERT INTO reservas (sala_id, nome_responsavel, data, hora_inicio) VALUES (?, ?, ?, ?)"
          )
          .run(salaId, nomeResponsavel, data, horaInicio);

        const criada = db
          .query(`${buscarReservasSql} WHERE r.id = ?`)
          .get(Number(res.lastInsertRowid)) as Reserva;

        return json(criada, 201);
      } catch (err) {
        if (String(err).includes("UNIQUE")) {
          return json(
            { erro: "Esta sala já está reservada nessa data e horário." },
            409
          );
        }
        console.error(err);
        return json({ erro: "Erro interno ao salvar a reserva." }, 500);
      }
    }

    const cancelarMatch = pathname.match(/^\/api\/reservas\/(\d+)\/cancelar$/);
    if (cancelarMatch && method === "PATCH") {
      const id = Number(cancelarMatch[1]);
      const atual = db
        .query("SELECT status FROM reservas WHERE id = ?")
        .get(id) as { status: string } | null;

      if (!atual) {
        return json({ erro: "Reserva não encontrada." }, 404);
      }
      if (atual.status === "cancelada") {
        return json({ erro: "Esta reserva já está cancelada." }, 409);
      }

      db.prepare("UPDATE reservas SET status = 'cancelada' WHERE id = ?").run(id);

      const atualizada = db
        .query(`${buscarReservasSql} WHERE r.id = ?`)
        .get(id) as Reserva;

      return json(atualizada);
    }

    // --- DASHBOARD ---
    if (method === "GET" && pathname === "/api/dashboard") {
      const hoje = hojeLocal();

      const resumoSalas = db
        .query(
          "SELECT COUNT(*) as totalSalas, COALESCE(SUM(capacidade), 0) as capacidadeTotal FROM salas"
        )
        .get() as { totalSalas: number; capacidadeTotal: number };

      const ativas = db
        .query("SELECT COUNT(*) as c FROM reservas WHERE status = 'ativa'")
        .get() as { c: number };

      const canceladas = db
        .query("SELECT COUNT(*) as c FROM reservas WHERE status = 'cancelada'")
        .get() as { c: number };

      const hojeRes = db
        .query(
          "SELECT COUNT(*) as c FROM reservas WHERE status = 'ativa' AND data = ?"
        )
        .get(hoje) as { c: number };

      const totalReservas = ativas.c + canceladas.c;
      const taxaConfirmacao =
        totalReservas > 0 ? Math.round((ativas.c / totalReservas) * 100) : 0;

      // Próximas datas (a partir de hoje) com reservas ativas, até sete.
      const porData = db
        .query(
          "SELECT data, COUNT(*) as total FROM reservas WHERE status = 'ativa' AND data >= ? GROUP BY data ORDER BY data ASC LIMIT 7"
        )
        .all(hoje) as { data: string; total: number }[];

      const rankingSalas = db
        .query(
          `SELECT s.nome, COUNT(r.id) as total
           FROM salas s
           LEFT JOIN reservas r ON r.sala_id = s.id AND r.status = 'ativa'
           GROUP BY s.id
           ORDER BY total DESC, s.nome ASC`
        )
        .all() as { nome: string; total: number }[];

      const resumo: ResumoDashboard = {
        totalSalas: resumoSalas.totalSalas,
        capacidadeTotal: resumoSalas.capacidadeTotal,
        reservasAtivas: ativas.c,
        reservasCanceladas: canceladas.c,
        reservasHoje: hojeRes.c,
        taxaConfirmacao,
        porData,
        rankingSalas,
      };

      return json(resumo);
    }

    return json({ erro: "Rota não encontrada." }, 404);
  },
});

console.log(`API rodando em http://localhost:${server.port}`);
console.log(`Documentação Scalar em http://localhost:${server.port}/docs`);