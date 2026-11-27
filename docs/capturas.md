# Reprodução das evidências

As 14 capturas do roteiro de demonstração estão em `docs/evidencias/` (00 a 09, mais painel, salas, relatórios e Scalar). A prévia do Scalar (`api-scalar-previa.png`) é um recorte do topo de `api-scalar.png`, gerado para leitura rápida.

## Pré-requisitos

- Bun instalado e `bun install` executado na raiz do projeto.
- Python 3 com Playwright, usado apenas para as capturas.
- Uma cópia de demonstração com banco limpo, sem reservas. O script não apaga dados.

## Passos

1. Na raiz do projeto, em um terminal:

```bash
bun run dev
```

2. Em outro terminal, na mesma raiz:

```bash
py -m pip install playwright
py -m playwright install chromium
py scripts/capturar.py
```

Em sistemas que não usam `py`, substitua por `python3`.

3. O script grava as capturas em `docs/evidencias-novas/` e um relatório em `docs/evidencias-atualizadas.md`.
4. Confira as imagens e, se estiverem corretas, copie-as para `docs/evidencias/`, substituindo as antigas. Refaça também `api-scalar-previa.png` como recorte do topo de `api-scalar.png`.
5. Remova `docs/evidencias-novas/` e `docs/evidencias-atualizadas.md`, que são arquivos de trabalho e estão no `.gitignore`.

## Cuidados

- O script verifica que não há reservas antes de começar. Se houver, ele para; use uma cópia limpa do banco.
- O script cria reservas fictícias de demonstração, incluindo uma cancelada, e não remove dados existentes.
- O Scalar depende de acesso à CDN. Se a página não carregar, o script registra a falha e continua com as demais capturas.
- A captura é de página inteira, com viewport de 1440 × 1000; páginas mais longas produzem imagens mais altas.
- Não execute em ambiente de produção.
