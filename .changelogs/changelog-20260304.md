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

