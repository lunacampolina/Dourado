# Testes e critérios de aceitação

## 1. Objetivo

Verificar o cadastro, a consulta, o cancelamento e a regra que impede reservas simultâneas para a mesma sala, data e hora, além das validações da API.

## 2. Preparação

Execute `bun install` e `bun run dev` na raiz do projeto. Para os testes automatizados, a API precisa estar em execução na porta 3000.

Para o roteiro manual, abra http://localhost:5173, acesse Agenda e confirme que Sala 1 e Sala 2 existem. Use somente nomes fictícios.

## 3. Testes automatizados

```bash
bun run test:api
```

O script `scripts/testar-api.ts` executa todas as verificações desta seção pela API. A cada execução ele usa uma data de teste nova, portanto pode ser repetido sem conflito, e cancela os registros que criou ao final, preservando o histórico. O código de saída é `0` somente se todas as verificações passarem.

## 4. Cenário obrigatório

Os identificadores são mantidos para rastreabilidade. A ordem de execução é a da tabela.

| ID | Ação | Resultado esperado | HTTP esperado |
|---|---|---|---|
| T01 | Reservar Sala 1, Ana Silva, data de teste, 14h | Reserva criada como ativa | 201 |
| T02 | Reservar Sala 1, Bruno Lima, mesma data, 14h | Cadastro rejeitado por conflito | 409 |
| T03 | Reservar Sala 2, Bruno Lima, mesma data, 14h | Reserva criada normalmente | 201 |
| T04 | Filtrar por Sala 1 e data | Apenas registros da Sala 1 | 200 |
| T05 | Cancelar a reserva de Ana Silva | Status cancelada; horário liberado | 200 |
| T06 | Reservar Sala 1, Carla Souza, mesma data, 14h | Nova reserva ativa criada | 201 |
| T07 | Consultar a agenda da data, com todos os status | Duas reservas ativas e uma cancelada | 200 |
| T14 | Filtrar por status cancelada | Apenas a reserva de Ana Silva | 200 |

No roteiro manual, use 27/11/2026 ou outra data sem reservas às 14h nas Salas 1 e 2.

## 5. Validações complementares

| ID | Ação | Resultado esperado | HTTP |
|---|---|---|---|
| T08 | Reserva sem nome do responsável | Rejeição | 400 |
| T09a | Hora 14.5 | Rejeição | 400 |
| T09b | Hora 24 | Rejeição | 400 |
| T10a | Data no formato 27/11/2026 | Rejeição | 400 |
| T10b | Data inexistente 2026-02-31 | Rejeição | 400 |
| T11 | Sala inexistente | Rejeição | 404 |
| T12 | Sala com capacidade zero | Rejeição | 400 |
| T13 | Sala com nome já existente | Rejeição | 409 |
| T15 | Cancelar reserva já cancelada | Rejeição | 409 |
| T16 | Cancelar reserva inexistente | Rejeição | 404 |

## 6. Tipos e casos de borda

| ID | Ação | Resultado esperado | HTTP |
|---|---|---|---|
| T17 | Capacidade como texto `"6"` | Rejeição | 400 |
| T18 | Capacidade `true` | Rejeição | 400 |
| T19 | Capacidade `2.5` | Rejeição | 400 |
| T20 | Edição de sala com capacidade em texto | Rejeição | 400 |
| T21 | Reserva com sala em texto `"3"` | Rejeição | 400 |
| T22 | Reserva com hora em texto `"14"` | Rejeição | 400 |
| T23 | JSON inválido | Rejeição | 400 |
| T24 | Hora 0 | Aceita | 201 |
| T25 | Hora 23 | Aceita | 201 |
| T26 | Filtro de sala não numérico | Rejeição | 400 |
| T27 | Filtro de status desconhecido | Rejeição | 400 |
| T28 | Filtro de data inexistente | Rejeição | 400 |
| T29 | Edição de sala com nome já usado | Rejeição | 409 |
| T30 | Edição de sala inexistente | Rejeição | 404 |
| T31 | Rota desconhecida | Rejeição | 404 |

## 7. Critérios de aceitação

O sistema é aceito quando:

1. Os testes T01 a T07 e T14 passam, com a regra de exclusividade por sala, data e hora.
2. Salas diferentes aceitam reservas no mesmo horário (T03).
3. Após o cancelamento, o horário volta a ficar disponível (T05 e T06).
4. Todas as validações das seções 5 e 6 retornam o código HTTP indicado.
5. `bun run test:api` termina sem falhas.

## 8. Execução nesta revisão — 27/11/2026

**Resultado: 33 de 33 verificações aprovadas** por `bun run test:api`, executado contra a API desta versão, com banco limpo. O script foi executado duas vezes seguidas, com datas de teste diferentes, e ambas passaram.

Resumo por grupo:

| Grupo | Verificações | Resultado |
|---|---|---|
| Roteiro obrigatório (T01–T07, T14) | 8 | Aprovadas |
| Validações complementares (T08–T13, T15–T16) | 10 | Aprovadas |
| Tipos e casos de borda (T17–T31) | 15 | Aprovadas |

Antes desta revisão, o teste de tipos de capacidade (T17 e T18) falhava: a API aceitava `"6"` e `true`. A correção foi aplicada e o teste passa.

## 9. Evidências visuais

As capturas em `docs/evidencias/` foram geradas pelo roteiro Playwright (`scripts/capturar.py`) na execução local de 27/11/2026, com a versão revisada. Para refazê-las, siga [a reprodução das capturas](capturas.md).

| Imagem | Mostra |
|---|---|
| 00-agenda-inicial | Agenda antes das reservas |
| 01-reserva-sala-1 | T01: Ana Silva na Sala 1 às 14h |
| 02-conflito | T02: duplicidade rejeitada |
| 03-reserva-sala-2 | T03: Bruno Lima na Sala 2 às 14h |
| 04-cancelamento | T05: reserva de Ana Silva cancelada |
| 05-nova-reserva | T06: Carla Souza na Sala 1 às 14h |
| 06-agenda-todos | T07: duas ativas e uma cancelada |
| 07-filtro-ativas | Filtro de reservas ativas |
| 08-filtro-canceladas | T14: somente a cancelada |
| 09-filtro-sala-data | T04: somente a Sala 1 na data |

As imagens `05-nova-reserva` e `06-agenda-todos` são idênticas, pois representam o mesmo estado da agenda após T06 e T07.

## 10. Teste manual

Para conferir a interface, siga o roteiro da seção 4 pela tela Agenda. Para o cancelamento (T05), use o botão Cancelar da linha de Ana Silva.
