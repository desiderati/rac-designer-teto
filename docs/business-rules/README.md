---
title: Regras de Negócio
doc_type: index
doc_role: index
doc_set: business-rules
status: active
lang: pt-BR
---

# Regras de Negócio

## Objetivo

Este diretório concentra as regras funcionais duráveis do `RAC Designer TETO`.

As regras daqui descrevem comportamento esperado do produto, limites operacionais e consistência
entre fluxos 2D, 3D e edição estrutural. Quando houver dúvida sobre como o editor deve se comportar,
este é o ponto de entrada correto.

## Convenção de organização

1. Cada documento usa o padrão `BUS-00x-{business-rule-slug}.md`.

2. A numeração expressa a ordem canônica de leitura e referência.

3. `docs/README.md` continua sendo o índice geral de `docs/`; este arquivo é o índice específico das
   regras de negócio.

## Ordem canônica

1. [BUS-001-canvas.md](BUS-001-canvas.md)
    - Como funciona o espaço de desenho, seleção, navegação, atalhos e segurança de edição.

2. [BUS-002-toolbar.md](BUS-002-toolbar.md)
    - Como menus e comandos do editor devem se comportar no uso diário.

3. [BUS-003-vistas-por-tipo.md](BUS-003-vistas-por-tipo.md)
    - Limites e regras de inserção e remoção de vistas para cada tipo de casa.

4. [BUS-004-piloti-nivel.md](BUS-004-piloti-nivel.md)
    - Regras de edição de nível e consistência estrutural.

5. [BUS-005-piloti-mestre.md](BUS-005-piloti-mestre.md)
    - Regra de mestre único e efeitos dessa escolha.

6. [BUS-006-contraventamento.md](BUS-006-contraventamento.md)
    - Fluxo de criação, remoção e restrições por coluna e lado.

7. [BUS-007-viewer-3d.md](BUS-007-viewer-3d.md)
    - Regras de visualização 3D, sincronização e inserção de snapshot no 2D.

8. [BUS-008-indicador-dificuldade-terreno.md](BUS-008-indicador-dificuldade-terreno.md)
    - Regra do indicador de dificuldade do terreno, calculado por solo, desnível, obstáculos e pilotis.

9. [BUS-009-materiais-terreno.md](BUS-009-materiais-terreno.md)
    - Regra de materiais de base do terreno e definição de pedras como rachão + brita.

10. [BUS-010-status-casa.md](BUS-010-status-casa.md)
    - Regra de status da casa, impressão do RAC, bloqueio de casa construída, retorno para rascunho
      e exclusão definitiva de casa arquivada em construção navegável.

11. [BUS-011-status-construcao.md](BUS-011-status-construcao.md)
    - Regra de status da Construção TETO, bloqueio de edição e exclusão física em cascata quando a
      construção está arquivada.

12. [BUS-012-checklist-exportacao-rac.md](BUS-012-checklist-exportacao-rac.md)
    - Regra do checklist exibido antes da exportação padrão de PDF da RAC.

13. [BUS-013-exportacao-racs-zip.md](BUS-013-exportacao-racs-zip.md)
    - Regra da exportação em lote das RACs de uma construção para arquivo ZIP.

## Quando atualizar

Atualize estes documentos quando houver mudança em:

1. Fluxo de interação para o usuário.
2. Limite ou regra de negócio.
3. Regra de segurança operacional do editor.
4. Consistência esperada entre canvas, toolbar, vistas, pilotis, contraventamento e 3D.
