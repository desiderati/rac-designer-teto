# Changelog — 2026-03-13

## fix(import): porta na planta após importação de JSON

- Corrigida reconstrução de metadados de vistas no `toRebuildViewSource` para usar `houseView` legado quando `houseViewType` não existe.
- Isso preserva corretamente `views/sideMappings` ao importar arquivos JSON antigos e evita perda de referência da casa.
- Adicionada compatibilidade no refresh de marcador de porta da planta para aceitar `doorMarkerSide` e também `markerSide` (legado).

## impacto

- A porta volta a aparecer na vista planta após importação de JSON com formatos antigos.
- Importações com casa existente mantêm o estado da casa reconstruído corretamente.
