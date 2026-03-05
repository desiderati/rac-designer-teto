## 2026-03-04

### Correções

- Padronização dos nomes do `describe` principal em smoke tests para refletir o arquivo-alvo testado (`<arquivo>.ts`/
  `<arquivo>.tsx`), cobrindo toda a suíte `*.smoke.test.*`.
- Ajuste dos smoke tests de escada para o contrato atual:
    - `stairs-parser.smoke.test.ts`: função `parseStairsFromElevationViews` validada como retorno único (
      `Stairs3DData | null`) e uso de `stairWidth`.
    - `house-auto-stairs.smoke.test.ts`: expectativas atualizadas de `stairsStepCount` e composição geométrica da
      escada.
    - `House3DScene.smoke.test.tsx`: ajuste para prop `stairs` como objeto único e expectativas de geometria conforme
      render atual.
- Correção defensiva em `House3DScene.tsx` para evitar acesso inválido quando `stairs` é `null` no cálculo de margem do
  terreno.
- Refatoração de `StairsMesh` em `House3DScene.tsx` para eliminar uso condicional de hooks (`useMemo`) e adequar às
  regras do React Hooks.
- Ajuste de dependências de `useMemo` em `TerrainMesh` (`[pilotis, margin]`) para consistência de lint.

### Validações executadas

- `npx vitest run smoke.test` (64/64 arquivos, 163/163 testes)
- `npm run lint` (sem erros; 1 warning conhecido de Fast Refresh)
- `npm run test:e2e` (17/17 testes passando)

### Ajuste adicional (nomes de smoke tests x arquivo-alvo)

- Renomeados smoke tests para casar com os arquivos realmente testados:
    - src/components/rac-editor/lib/3d/scene-openings-builder.smoke.test.ts ->
      src/components/rac-editor/lib/3d/house-elements-parser.smoke.test.ts;
    - src/components/rac-editor/lib/3d/piloti-visibility.smoke.test.ts ->
      src/components/rac-editor/lib/3d/piloti-parser.smoke.test.ts.
- house-auto-stairs-settings.smoke.test.ts foi consolidado em house-auto-stairs.smoke.test.ts (mesmo alvo
  house-auto-stairs.ts) para evitar colisão de nome de arquivo duplicado.
- Validação de consistência: 63 smoke tests e 0 sem arquivo-alvo correspondente.
- Revalidação:
  px vitest run smoke.test (63/63 arquivos, 163/163 testes) e
  pm run lint sem erros (1 warning conhecido).

### Documentação (guideline de testes e validações)

- Novo documento: .guidelines/testing-validation-workflow.md.
- Conteúdo inclui:
    - regra de nomenclatura para smoke tests por arquivo-alvo;
    - critérios de consolidação quando houver colisão de nome;
    - checklist operacional da rodada (smoke, lint, e2e);
    - comandos padrão e critérios mínimos de aceitação;
    - protocolo de registro de evidências no changelog.

### README (atualização incremental)

- Revisão incremental de README.md para compatibilidade com o estado atual do código.
- Ajustes principais:
  - correção do fluxo do Agent 1 para execução diária no bloco de workflow;
  - seção File Structure sincronizada com a estrutura real do repositório (incluindo .guidelines, .changelogs, .manus e src/components/rac-editor);
  - adição de seção Comandos principais (estado atual) com scripts reais do package.json;
  - atualização de nomenclatura de modal (ConfirmDialogModal);
  - atualização de Version History (1.1.0) e Last Updated para 2026-03-04;
  - atualização dos recursos adicionais com referências a .guidelines/testing-validation-workflow.md e .rules/README.md.

### Regras funcionais (migração e enriquecimento de .rules-new)

- Mapeamento extensivo executado nos módulos `rac-editor`, `canvas`, `3d`, `domain/house`, `shared` e `infra` para validar regras de negócio vigentes no código.
- Enriquecimento completo de `.rules-new` com base no conteúdo detalhado de `.rules-old`, preservando granularidade funcional por arquivo correspondente.
- Correções de compatibilidade aplicadas durante a migração:
  - atualização de caminhos legados para a estrutura atual (`ui/`, `hooks/canvas`, `hooks/modals`, `ui/modals`, `ui/toolbar/helpers`);
  - atualização de nomes de funções e artefatos (`useHotkeys`, `parseStairsFromElevationViews`, smoke tests 3D renomeados);
  - ajustes de regra no `viewer-3d` conforme código atual (espessura do terreno e sem remoção extra de degrau na cena 3D).
- Validação automática final de referências locais em `.rules-new`: `OK_NO_BROKEN_PATHS`.
- Arquivos atualizados em `.rules-new`:
  - `README.md`
  - `canvas.md`
  - `contraventamento.md`
  - `piloti-mestre.md`
  - `piloti-nivel.md`
  - `refactoring-agents.md`
  - `toolbar.md`
  - `viewer-3d.md`
  - `vistas-por-tipo.md`

### Reescrita de linguagem das regras (.rules-new)

- Reescrita completa dos documentos de .rules-new para linguagem funcional e fluida, voltada a pessoas não técnicas.
- Removido tecnicismo acoplado a implementação e detalhes internos de código.
- Mantidas regras de negócio e comportamento esperado por tema (canvas, 	oolbar, istas, piloti, contraventamento, iewer-3d, gentes).
- Arquivos revisados:
  - README.md`n  - canvas.md`n  - contraventamento.md`n  - piloti-mestre.md`n  - piloti-nivel.md`n  - efactoring-agents.md`n  - 	oolbar.md`n  - iewer-3d.md`n  - istas-por-tipo.md`n
