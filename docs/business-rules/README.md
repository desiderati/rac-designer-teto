# Regras de Negócio

## Objetivo

Este diretório concentra as regras funcionais duráveis do `RAC Designer TETO`.

As regras daqui descrevem comportamento esperado do produto, limites operacionais e consistência entre fluxos 2D, 3D
e edição estrutural. Quando houver dúvida sobre como o editor deve se comportar, este é o ponto de entrada correto.

## Convenção de organização

1. Cada documento usa o padrão `BUS-00x-{business-rule-slug}.md`.
2. A numeração expressa a ordem canônica de leitura e referência.
3. `../README.md` continua sendo o índice geral de `docs/`; este arquivo é o índice específico das regras de negócio.

## Ordem canônica

1. `BUS-001-canvas.md`
    - Como funciona o espaço de desenho, seleção, navegação, atalhos e segurança de edição.

2. `BUS-002-toolbar.md`
    - Como menus e comandos do editor devem se comportar no uso diário.

3. `BUS-003-vistas-por-tipo.md`
    - Limites e regras de inserção e remoção de vistas para cada tipo de casa.

4. `BUS-004-piloti-nivel.md`
    - Regras de edição de nível e consistência estrutural.

5. `BUS-005-piloti-mestre.md`
    - Regra de mestre único e efeitos dessa escolha.

6. `BUS-006-contraventamento.md`
    - Fluxo de criação, remoção e restrições por coluna e lado.

7. `BUS-007-viewer-3d.md`
    - Regras de visualização 3D, sincronização e inserção de snapshot no 2D.

## Quando atualizar

Atualize estes documentos quando houver mudança em:

1. Fluxo de interação para o usuário.
2. Limite ou regra de negócio.
3. Regra de segurança operacional do editor.
4. Consistência esperada entre canvas, toolbar, vistas, pilotis, contraventamento e 3D.
