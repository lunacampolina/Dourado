# Referência da API

A API é servida pelo Bun na porta 3000. A interface usa caminhos relativos e o proxy do Vite. A referência interativa está em http://localhost:5173/docs e a especificação em http://localhost:3000/openapi.json. Os contratos são definidos em `packages/tipos/index.ts`.

## Operações

| Método | Caminho | Entrada | Sucesso |
|---|---|---|---|
| GET | /api/salas | busca (opcional) | 200, lista de salas |
| POST | /api/salas | nome, capacidade | 201, sala criada |
| PUT | /api/salas/:id | nome, capacidade | 200, sala atualizada |
| DELETE | /api/salas/:id | ID na rota | 200, `{ "ok": true }` |
| GET | /api/reservas | salaId, data, status (opcionais) | 200, lista de reservas |
| POST | /api/reservas | salaId, nomeResponsavel, data, horaInicio | 201, reserva criada |
| PATCH | /api/reservas/:id/cancelar | ID na rota, sem corpo | 200, reserva cancelada |
| GET | /api/dashboard | Sem parâmetros | 200, resumo |

## Exemplos de corpos JSON

Cadastro ou edição de sala (capacidade deve ser número inteiro, sem aspas):

```json
{"nome":"Sala 4","capacidade":10}
```

Cadastro de reserva (confirme o ID da sala e a disponibilidade):

```json
{"salaId":1,"nomeResponsavel":"Pessoa Teste","data":"2026-12-01","horaInicio":14}
```

A resposta de reserva contém `id`, `salaId`, `salaNome`, `salaCapacidade`, `nomeResponsavel`, `data`, `horaInicio`, `status` e `criadoEm`. O status é `ativa` ou `cancelada`.

## Tipos aceitos

- `salaId`, `horaInicio` e `capacidade` devem ser números inteiros (JSON sem aspas). Texto como `"6"`, booleanos, `null` e decimais como `2.5` são rejeitados com 400.
- `nomeResponsavel` e `nome` são textos; espaços nas extremidades são removidos e o valor vazio é rejeitado.
- `data` é texto no formato AAAA-MM-DD e deve existir no calendário.

## Consultas e cancelamento

Exemplos de caminhos (substitua IDs pelos retornados pela API):

```text
GET /api/salas?busca=Sala
GET /api/reservas?salaId=1&data=2026-12-01&status=ativa
PATCH /api/reservas/1/cancelar
```

Os filtros são combinados com AND. Valores inválidos retornam 400:

- `salaId`: inteiro positivo ou `todas` (ausente também equivale a todas).
- `data`: AAAA-MM-DD existente no calendário.
- `status`: `ativa`, `cancelada` ou `todos` (ausente também equivale a todos).

A ordenação das reservas é por data e hora de início. Cancelar uma reserva que já está cancelada retorna 409; o horário é liberado somente na primeira vez.

## Indicadores

`GET /api/dashboard` retorna `totalSalas`, `capacidadeTotal`, `reservasAtivas`, `reservasCanceladas`, `reservasHoje`, `taxaConfirmacao`, `porData` e `rankingSalas`.

- `taxaConfirmacao` é a proporção de reservas ativas em relação ao total registrado, arredondada para inteiro; sem registros, retorna zero.
- `reservasHoje` conta as reservas ativas da data atual no fuso local do servidor.
- `porData` lista até sete datas com reservas ativas a partir de hoje, em ordem crescente. Datas passadas não aparecem nesse campo.

## Erros previstos

| HTTP | Situação |
|---|---|
| 400 | Dados ou filtros inválidos: campo ausente ou de tipo errado, texto onde se espera número, data fora do formato ou inexistente, hora fora de 0–23, capacidade não inteira positiva, status desconhecido, JSON inválido |
| 404 | Sala ou reserva inexistente, ou rota desconhecida |
| 409 | Conflito de reserva (sala já ocupada no horário), reserva já cancelada, ou nome de sala já usado |
| 500 | Erro inesperado no servidor (registrado no terminal) |

Exemplo de conflito:

```json
{"erro":"Esta sala já está reservada nessa data e horário."}
```

Estes códigos são verificados automaticamente por `bun run test:api`. Veja [testes.md](testes.md).
