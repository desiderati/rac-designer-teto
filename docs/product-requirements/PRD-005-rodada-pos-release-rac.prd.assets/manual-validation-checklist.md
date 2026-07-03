---
title: Checklist de Validação Manual da Rodada Pós-Release RAC
doc_type: prd_asset
doc_set: product-requirements
parent: PRD-005-rodada-pos-release-rac.prd.md
status: active
lang: pt-BR
---

# Checklist de Validação Manual da Rodada Pós-Release RAC

## Objetivo

Validar manualmente os ajustes finais associados ao PRD-005, com foco nos fluxos de rua no Canvas,
exportação de RACs em lote, tour guiado e responsividade da listagem de Construções TETO.

## Preparação

- [ ] Subir o app localmente com `npm run dev:local`.
- [ ] Abrir uma construção `Em andamento` com pelo menos uma casa não arquivada.
- [ ] Ter uma construção `Concluída` disponível para validar bloqueio de exportação.
- [ ] Ter uma construção `Arquivada` disponível para validar ações restritas.
- [ ] Se possível, ter uma construção sem casas não arquivadas para validar exportação desabilitada.

## Ícones de Rua

- [ ] Abrir o menu lateral do Canvas.
- [ ] Abrir o grupo `Elementos`.
- [ ] Confirmar que `Rua Reta` usa o ícone `Road`.
- [ ] Confirmar que `Rua em Quina` usa o ícone `Road Bridge`.
- [ ] Confirmar tooltips/labels corretos: `Rua Reta` e `Rua em Quina`.

## Objeto Rua no Canvas

- [ ] Inserir `Rua Reta`.
- [ ] Confirmar que a rua tem fundo cinza e tracejado central branco.
- [ ] Confirmar que as bordas da rua estão discretas e não visualmente grossas.
- [ ] Inserir `Rua em Quina`.
- [ ] Confirmar que a quina mantém formato em `L`.
- [ ] Confirmar que não existe borda interna cortando a interseção das duas ruas.
- [ ] Confirmar que o tracejado horizontal superior não começa com o primeiro traço mais à esquerda.
- [ ] Confirmar que o tracejado vertical inferior termina antes do limite da rua, deixando margem cinza embaixo.
- [ ] Selecionar, mover e redimensionar os objetos de rua.
- [ ] Confirmar que cada rua continua selecionável como um único grupo.
- [ ] Salvar/recarregar ou trocar de casa e voltar.
- [ ] Confirmar que as ruas continuam aparecendo corretamente após persistência.

## Exportar RACs ZIP

- [ ] Abrir `Construções TETO`.
- [ ] Na listagem, confirmar que o botão de exportar RACs aparece no grupo de ícones da construção.
- [ ] Confirmar que o botão está junto das ações de monitores, casas, concluir e arquivar.
- [ ] Confirmar que o botão não aparece no formulário de edição da construção.
- [ ] Clicar no botão `Exportar RACs ZIP` de uma construção `Em andamento`.
- [ ] Confirmar que o clique não abre a tela de edição da construção.
- [ ] Confirmar que o botão entra em estado de carregamento: `Gerando ZIP das RACs...`.
- [ ] Confirmar download do ZIP quando houver casas elegíveis.
- [ ] Confirmar que casas arquivadas não entram no ZIP.
- [ ] Confirmar que casas exportadas com sucesso mudam para `RAC Impressa`, exceto casas já `Construídas`.

## Estados Bloqueados

- [ ] Em construção `Concluída`, confirmar que o botão de exportar RACs fica desabilitado.
- [ ] Em construção sem casas não arquivadas, confirmar que o botão de exportar RACs fica desabilitado.
- [ ] Em construção `Arquivada`, confirmar que aparecem apenas ações compatíveis com arquivamento/desarquivamento.
- [ ] Confirmar que construção arquivada não mostra exportação de RACs em lote.

## Tour Guiado

- [ ] Limpar o progresso do tour de ações da construção no navegador.
- [ ] Abrir `Construções TETO`.
- [ ] Confirmar que o tour inicia no grupo de ações da construção.
- [ ] Confirmar que o tour passa por `Monitores`.
- [ ] Confirmar que o tour passa por `Casas e Famílias`.
- [ ] Confirmar que o tour passa por `Exportar RACs`.
- [ ] Confirmar que o tour passa por `Construção Concluída`.
- [ ] Confirmar que o tour passa por `Arquivar Construção`.
- [ ] Confirmar que o passo `Exportar RACs` aponta para o novo botão da listagem.

## Responsivo

- [ ] Validar a listagem de Construções TETO em desktop.
- [ ] Validar a listagem de Construções TETO em largura mobile/tablet.
- [ ] Confirmar que os ícones da construção não estouram o card ou a linha.
- [ ] Confirmar que código, comunidade, status e data continuam legíveis.
- [ ] Confirmar que textos longos continuam truncados sem deslocar os botões de ação.

## Evidências Recomendadas

- [ ] Capturar screenshot do menu `Elementos` com os ícones `Rua Reta` e `Rua em Quina`.
- [ ] Capturar screenshot da `Rua em Quina` no Canvas mostrando o tracejado ajustado.
- [ ] Capturar screenshot da listagem com o botão `Exportar RACs ZIP`.
- [ ] Registrar nome do arquivo ZIP gerado em um teste manual.
- [ ] Registrar qualquer comportamento divergente com construção, casa, status e navegador usados.

