import { Database } from "bun:sqlite";
import { join } from "node:path";

const caminhoBanco = join(import.meta.dir, "..", "reservas.sqlite");
export const db = new Database(caminhoBanco, { create: true });

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS salas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    capacidade INTEGER NOT NULL CHECK (capacidade > 0)
  );

  CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sala_id INTEGER NOT NULL,
    nome_responsavel TEXT NOT NULL,
    data TEXT NOT NULL,
    hora_inicio INTEGER NOT NULL CHECK (hora_inicio >= 0 AND hora_inicio <= 23),
    status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'cancelada')),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_reserva_unica_ativa
  ON reservas (sala_id, data, hora_inicio)
  WHERE status = 'ativa';
`);

// Seed inicial para facilitar testes e demonstração
const total = db.query("SELECT COUNT(*) as c FROM salas").get() as { c: number };
if (total.c === 0) {
  const inserir = db.prepare("INSERT INTO salas (nome, capacidade) VALUES (?, ?)");
  inserir.run("Sala 1", 6);
  inserir.run("Sala 2", 8);
  inserir.run("Sala 3", 4);
}