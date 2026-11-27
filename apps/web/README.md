# Frontend — Salas de Estudo

Interface React + TypeScript + Vite + Tailwind CSS (shadcn/ui).

## Páginas (`src/pages`)

| Arquivo | Função |
|---|---|
| `Dashboard.tsx` | Indicadores e distribuição das reservas |
| `Agenda.tsx` | Nova reserva, filtros por sala, data e status, cancelamento |
| `Salas.tsx` | Cadastro, busca, edição e exclusão de salas |
| `Relatorios.tsx` | Histórico e totais por sala |

O cliente HTTP está em `src/lib/api.ts` e usa caminhos relativos (`/api/...`); o Vite encaminha as chamadas para a API na porta 3000 (`vite.config.ts`).

## Comandos

Execute a partir da raiz do repositório (`bun install` uma única vez):

```bash
bun run dev:web                 # servidor de desenvolvimento (porta 5173)
bun run --cwd=apps/web build    # build de produção
bun run --cwd=apps/web typecheck
bun run --cwd=apps/web lint
```

Veja o [README principal](../../README.md) para executar o projeto completo.
