# AGENTS — RAC Designer TETO

## Context

- Este subprojeto representa o editor RAC Designer TETO descrito em `README.md`. Sempre siga as convenções e prioridades
  listadas ali antes de codificar.
- Trabalhe exclusivamente dentro de `personal/rac-designer-teto` durante esta sessão; evite operar na raiz ou em outros
  projetos.
- Consulte o diretório `.guidelines/` antes de propor mudanças de interface e experiência.
- Para decisões de UI/UX, use como referência principal `.guidelines/ux-design.md`.
- Quando criar documentação, manter a acentuação da língua nativa. 

## Ambiente e comandos principais

- Use `npm install` ao trocar de branch ou após limpar `node_modules` para garantir que dependências estejam alinhadas
  com `package-lock.json`.
- Para executar o protótipo local, use `npm run dev -- --host 0.0.0.0` (ou outro valor que o README recomendar se ele
  mudar). Testes unitários e lint são `npm run test` e `npm run lint`, respectivamente; rode-os sempre que fizer
  mudanças significativas.
- Relatórios do Playwright vivem em `playwright-report`; limpe ou regenere apenas quando solicitado.

## Comunicação e entregas

- Responda sempre em português nesta pasta.
- Ao gerar ou editar arquivos em português, use sempre acentuação correta (nunca remover acentos).
- Documente rapidinho o que mudou num `CHANGELOG` local (se houver) antes de pedir revisão.
- Se precisar guardar artefatos (logs, capturas) em `test-results` ou `playwright-report`, avise antes de remover
  arquivos existentes.

## Contexto colaborativo

- Confirme comigo o objetivo antes de iniciar tarefas grandes (por exemplo: adicionar novas telas, alterar renderizador
  3D, mudar o sistema de undo/redo).
- Se o branch mudar ou o `package-lock.json` atualizar de forma inesperada, pare e peça uma visão geral do estado atual.
