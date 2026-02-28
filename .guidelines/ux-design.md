# RAC Editor - Padrões Arquiteturais

## Objetivo

Padronizar decisões de arquitetura no sistema para reduzir duplicação, evitar criação de funcionalidade paralela e
acelerar evolução com menor risco de regressão.

## Relação com outros guias

- Use este arquivo para decisões de UI/UX e interação.
- Use `.guidelines/architecture-patterns.md` para decisões de arquitetura, reutilização e extração de componentes/hooks.

## Princípios obrigatórios

1. Reuse-first: antes de criar algo novo, buscar componente/fluxo similar no projeto.
2. Compose-over-copy: preferir composição de componentes à duplicação de JSX/estado.
3. Behavior-first: alinhar comportamento antes de ajustar layout/estilo.
4. Rule of 2: ao identificar repetição em 2 pontos com chance de 3º uso, extrair comum.
5. One source of truth: regra compartilhada deve viver em um único lugar.

## Fluxo de decisão (ordem obrigatória)

1. Inventariar artefatos existentes com busca no código (`rg`).
2. Marcar o que é comum e o que é específico de domínio.
3. Extrair shell comum (container, ciclo de vida, ações padrão).
4. Manter em cada editor apenas regra de domínio.
5. Validar interações críticas antes de merge.

## Padrão para Modais e Editores

### Shell comum

Toda tela de edição deve usar um shell comum (ex.: `CommonEditor`/`ConfirmDialogModal`) com:

- Layout responsivo: `Dialog` no desktop e `Drawer` no mobile.
- Header opcional: título só deve renderizar se existir.
- Footer padrão: confirmar/cancelar em API única.
- Estado de confirmação desabilitada (`isConfirmDisabled`) centralizado.

### Exemplo de conteúdo específico

Cada editor especializado deve prover apenas:

- `title?`
- `content`
- `canConfirm` ou `isConfirmDisabled`
- `onConfirm`
- `onCancel`

Não duplicar lógica de abertura/fechamento, botões de ação e estrutura de modal em cada editor.

## Padrão para controles repetidos

Quando um bloco de UI repete (ex.: nível com `- / valor / + / slider`), extrair componente reutilizável:

- Entrada por props (valor, limites, callbacks, estado disabled).
- Formatação, limites e UX no componente comum.
- Editor consumidor não deve replicar markup nem regras básicas.

## Contratos de interação

1. Drag em editor flutuante deve iniciar apenas por handle explícito (header).
2. Elementos interativos não iniciam drag (`button`, `input`, `textarea`, `select`, `a`, roles interativas).
3. `disabled` deve refletir comportamento + visual (`cursor-not-allowed` e bloqueio real).
4. Slider em arraste ativo deve comunicar estado (`cursor-grabbing` durante drag).

## Regras de extração

Extrair componente comum quando houver:

1. Mesmo comportamento + pequena variação visual.
2. Mesmo fluxo de estado (abrir, editar, confirmar, cancelar).
3. Mesmo contrato de interação (drag, disabled, slider, validação).

Manter separado quando houver:

1. Regras de negócio diferentes.
2. Dependências de domínio diferentes.
3. Divergência de UX intencional e documentada.

## Anti-padrões (evitar)

1. Criar novo componente sem auditar reutilização existente.
2. Copiar e colar JSX de modal/editor entre arquivos.
3. Misturar regra de domínio com controle de container (Dialog/Drawer).
4. Corrigir visual sem validar contrato de interação.

## Checklist de PR (obrigatório)

1. Existe algo semelhante no projeto que poderia ser reutilizado?
2. O comum foi extraído para componente/função compartilhada?
3. O comportamento mobile/desktop permanece consistente?
4. Título e seções opcionais só renderizam quando definidos?
5. Estados disabled e drag foram testados manualmente?
6. Houve validação de regressão nos editores impactados?

## Convenções de implementação

1. Nomes de componentes comuns devem refletir papel funcional (`CommonEditor`, `NivelControl`, `ConfirmDialogModal`).
2. APIs de props devem ser pequenas e estáveis.
3. Evitar acoplamento com estado global quando props resolvem.
4. Priorizar composição de componentes puros e hooks focados.

## Estratégia de evolução

1. Primeiro consolidar Generic + Piloti em base comum.
2. Depois migrar demais editores para o mesmo shell.
3. Por último remover duplicações residuais e simplificar hooks.

Essa ordem reduz risco de regressão e facilita rollback por etapas.
