export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "API — Reserva de Salas de Estudo",
    version: "1.0.0",
    description:
      "Gerenciamento de salas de estudo com reservas de 1 hora em hora cheia.",
  },
  servers: [{ url: "http://localhost:3000" }],
  paths: {
    "/api/salas": {
      get: {
        summary: "Listar salas",
        parameters: [
          {
            name: "busca",
            in: "query",
            schema: { type: "string" },
            description: "Filtra salas pelo nome",
          },
        ],
        responses: { "200": { description: "Lista de salas" } },
      },
      post: {
        summary: "Criar sala",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nome", "capacidade"],
                properties: {
                  nome: { type: "string", example: "Sala 4" },
                  capacidade: { type: "integer", example: 10 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Sala criada" },
          "400": { description: "Dados inválidos" },
          "409": { description: "Nome de sala duplicado" },
        },
      },
    },
    "/api/salas/{id}": {
      put: {
        summary: "Atualizar sala",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nome", "capacidade"],
                properties: {
                  nome: { type: "string", example: "Sala 1 Reformada" },
                  capacidade: { type: "integer", example: 8 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Sala atualizada" },
          "400": { description: "Dados inválidos (capacidade deve ser inteiro maior que zero)" },
          "404": { description: "Sala não encontrada" },
          "409": { description: "Nome de sala já usado por outra sala" },
        },
      },
      delete: {
        summary: "Excluir sala",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Sala excluída" },
          "404": { description: "Sala não encontrada" },
        },
      },
    },
    "/api/reservas": {
      get: {
        summary: "Consultar agenda de reservas",
        parameters: [
          { name: "salaId", in: "query", schema: { type: "integer" } },
          {
            name: "data",
            in: "query",
            schema: { type: "string", example: "2026-11-26" },
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["ativa", "cancelada"] },
          },
        ],
        responses: {
          "200": { description: "Agenda filtrada" },
          "400": { description: "Filtro inválido (sala, data ou status)" },
        },
      },
      post: {
        summary: "Cadastrar reserva (1h, hora cheia)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["salaId", "nomeResponsavel", "data", "horaInicio"],
                properties: {
                  salaId: { type: "integer", example: 1 },
                  nomeResponsavel: { type: "string", example: "Lucas Silva" },
                  data: { type: "string", example: "2026-11-26" },
                  horaInicio: { type: "integer", example: 14 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Reserva criada" },
          "400": { description: "Dados inválidos" },
          "404": { description: "Sala não encontrada" },
          "409": { description: "Conflito: sala já reservada nesse horário" },
        },
      },
    },
    "/api/reservas/{id}/cancelar": {
      patch: {
        summary: "Cancelar reserva ativa",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Reserva cancelada e horário liberado" },
          "404": { description: "Reserva não encontrada" },
          "409": { description: "A reserva já estava cancelada" },
        },
      },
    },
    "/api/dashboard": {
      get: {
        summary: "Resumo de métricas para o Dashboard",
        responses: { "200": { description: "Contadores, próximas datas com reservas ativas e ranking de salas" } },
      },
    },
  },
};