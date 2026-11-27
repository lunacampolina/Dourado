# Requisitos do sistema

## Objetivo e escopo

Auxiliar a equipe da faculdade a organizar a utilização das salas de estudo, evitando conflitos de horário. O usuário previsto é a equipe responsável pela agenda; não existem perfis de acesso distintos na implementação atual.

O escopo obrigatório é: cadastrar reserva, filtrar a agenda por sala e data, cancelar reserva e impedir reserva duplicada na mesma sala, data e horário. Dashboard, Relatórios e a tela de gerenciamento de salas são funcionalidades complementares, e a documentação Scalar facilita a consulta da API.

## Requisitos funcionais

| ID | Requisito | Implementação | Verificação |
|---|---|---|---|
| RF01 | Gerenciar salas com nome e capacidade | Salas.tsx; rotas /api/salas | T12, T13, T17–T20, T29, T30 (script) |
| RF02 | Cadastrar reserva com sala, responsável fictício, data e hora cheia | Agenda.tsx; POST /api/reservas | T01, T08–T11, T21–T25 (script) |
| RF03 | Consultar agenda por sala e data | Agenda.tsx; GET /api/reservas | T04 (script e manual) |
| RF04 | Cancelar reserva existente | Agenda.tsx; PATCH de cancelamento | T05, T15, T16 (script) |
| RF05 | Impedir duplicidade de reserva ativa na mesma sala, data e hora | Índice único parcial no SQLite | T02 (script) |
| RF06 | Permitir reservas simultâneas em salas distintas | Índice inclui sala_id | T03 (script) |
| RF07 | Liberar horário após cancelamento | Alteração do status para cancelada | T05 e T06 (script) |
| RF08 | Consultar histórico por status | Agenda.tsx; GET /api/reservas | T07, T14, T27 (script) |
| RF09 | Apresentar indicadores e relatórios | Dashboard.tsx; Relatorios.tsx | Capturas em `docs/evidencias/` |
| RF10 | Disponibilizar documentação interativa da API | openapi.ts; /docs | Captura do Scalar |

## Características não funcionais implementadas

- Integridade: restrições SQL, chaves estrangeiras, índice único parcial e validação de tipos na API.
- Persistência: banco SQLite local, mantido entre execuções.
- Usabilidade: menu lateral, formulários, filtros, mensagens de sucesso ou erro e confirmação antes de excluir sala.
- Manutenibilidade: separação entre interface, API e tipos compartilhados, com testes de aceitação automatizados (`bun run test:api`).
- Interoperabilidade: API HTTP/JSON com especificação OpenAPI.

Não foram realizados ensaios de desempenho, acessibilidade ou segurança. Não há garantia de atendimento a metas nessas áreas.

## Regras de negócio

1. Cada reserva dura uma hora. A interface oferece início das 08h às 22h; a API aceita horas inteiras de 0 a 23.
2. A mesma sala não pode ter duas reservas ativas na mesma data e hora.
3. Salas diferentes podem ser reservadas simultaneamente.
4. O cancelamento mantém o registro no histórico e libera o horário. Cancelar uma reserva já cancelada é rejeitado (409).
5. O nome da sala deve ser único. A capacidade deve ser um número inteiro maior que zero; texto e booleanos são rejeitados.
6. A capacidade é informativa; o sistema não registra quantidade de participantes.
7. Excluir uma sala remove também suas reservas, conforme a chave estrangeira com exclusão em cascata. A interface pede confirmação antes dessa exclusão.

Consulte [os testes](testes.md) e [a arquitetura](../arquitetura.md).
