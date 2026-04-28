---
title: PRDs do Projeto
doc_type: index
doc_set: product-requirements
status: active
lang: pt-BR
---

# PRDs do Projeto

Este diretório reúne os PRDs canônicos do `RAC Designer TETO`.

## Convenção de nomes

- Markdown primário: `PRD-{id_number}-{slug}.prd.md`
- JSON derivado opcional: `PRD-{id_number}-{slug}.prd.json`
- Sidecar de assets: `PRD-{id_number}-{slug}.prd.assets/`

## Regras

1. O Markdown é a fonte humana principal.
2. O JSON derivado adjacente só existe quando houver valor real para automação, validação estrutural ou consumo por
   outro agente.
3. Diagramas, evidências, exportações brutas, scripts e derivados auxiliares ficam no sidecar `*.prd.assets/`.
4. O PRD não substitui `work-items`; estado operacional de execução continua fora deste diretório.

## Índice atual

- [PRD-001-evolucao-multicasa.prd.md](./PRD-001-evolucao-multicasa.prd.md)
