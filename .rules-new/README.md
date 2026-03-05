# Regras do RAC Designer TETO

Este diretório documenta as regras de negócio aplicadas no sistema com foco em entendimento de uso.

## Fontes usadas para estas regras

- Código de interface (`src/components/rac-editor/ui`)
- Hooks de comportamento (`src/components/rac-editor/hooks`)
- Motor 2D/3D e serviços (`src/components/rac-editor/lib`)
- Domínio (`src/domain/house`)
- Tipos e constantes (`src/shared`)
- Evidência de testes (`e2e` e `*.smoke.test.*`)

## Mapeamento de caminhos legados

Se você vir referências antigas em histórico/documentos externos:

- src/components/hooks (legado) -> src/components/rac-editor/hooks
- src/components/libs (legado) -> src/components/rac-editor/lib
- src/components/lib (legado) -> src/components/rac-editor/lib

## Ordem recomendada de leitura

1. `canvas.md` - interação base no editor.
2. `toolbar.md` - comandos disponíveis e restrições.
3. `vistas-por-tipo.md` - limites por tipo de casa.
4. `piloti-nivel.md` e `piloti-mestre.md` - regras estruturais de piloti.
5. `contraventamento.md` - regra estrutural de travamento.
6. `viewer-3d.md` - coerência entre 2D e 3D.

## Padrão de escrita adotado

Cada arquivo de regra traz:

- objetivo da regra;
- comportamento esperado para a pessoa usuária;
- decisões e bloqueios de negócio;
- exceções/cancelamentos;
- rastreabilidade para arquivos reais do código.

## Arquivos de regras

- `canvas.md`
- `toolbar.md`
- `vistas-por-tipo.md`
- `piloti-nivel.md`
- `piloti-mestre.md`
- `contraventamento.md`
- `viewer-3d.md`
- `refactoring-agents.md`
