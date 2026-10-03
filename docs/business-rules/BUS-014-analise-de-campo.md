---
title: Análise de Campo no mobile
id: BUS-014
doc_type: business-rule
doc_role: business-rule
doc_set: business-rules
order: 14
status: active
lang: pt-BR
---

# Análise de Campo no mobile

## Entrada e disponibilidade

- Abaixo de 768 px, o aplicativo abre na listagem de construções antes de montar o Canvas.
- A partir de 768 px, permanece a entrada atual no editor. O mínimo suportado continua em 420 px.
- O acesso explícito ao Canvas conserva os bloqueios de disponibilidade existentes.
- Na lista mobile de casas, Análise de Campo fica disponível para casa editável ainda não inserida.
  Casa construída ou arquivada e construção concluída ou arquivada exibem o motivo do bloqueio.
  Uma casa já inserida mantém a ação desabilitada sem texto auxiliar no card.

## Status da casa na listagem

- **Inicial**: a casa ainda não possui tipo/configuração definidos.
- **Definida**: possui configuração, inclusive preparação concluída na Análise de Campo.
- **Impressa**: possui configuração e RAC exportada, conforme o histórico existente.
- **Indefinida**: a casa já foi definida, mas sua configuração foi removida do Canvas. A Análise
  de Campo volta a ficar disponível, respeitando os bloqueios da casa e da construção.
- **Construída** e **Arquivada** preservam os bloqueios atuais e têm precedência na apresentação.

Os filtros, a ordenação e os badges usam esses mesmos estados. O metadado opcional
`hasHouseBeenDefined` preserva a distinção entre Inicial e Indefinida após recarregar. Os registros
legados continuam aceitos sem migração; o histórico de impressão permanece preservado. O estado
interno `draft` é compatível com o transporte existente e não é exibido como Rascunho na listagem.

## Configuração e retomada

1. A primeira abertura reutiliza as modais da inclusão: alturas disponíveis, quando habilitadas;
   tipo; orientação; níveis dos cantos, quando habilitados.
2. O setup permanece em rascunho até concluir todas as etapas aplicáveis. Cancelar antes disso não
   grava uma preparação parcial. Preferências desativadas usam os defaults do fluxo de inclusão.
3. Depois do setup, a tela mostra a planta ilustrativa e os controles existentes de pilotis abaixo.
   A planta não permite seleção, arraste, zoom ou edição e não cria vistas no documento real.
   O cabeçalho mostra somente o nome da família, sem subtítulo ou instruções intermediárias.
4. Uma preparação concluída abre diretamente nessa tela. Os ajustes efetivamente confirmados são
   salvos por construção e casa; a casa ativa e o documento de outra casa são preservados.
5. Mestre, níveis, alturas e contraventamentos mantêm as regras do editor. Para adicionar um
   contraventamento, o destino é escolhido nos controles, entre os pilotis válidos.
6. Os salvamentos confirmados são agrupados em janelas de 10 segundos para exibir um único toast,
   com a duração padrão de sucesso. A gravação não espera essa janela. Falhas preservam a
   configuração em tela e oferecem nova tentativa. Voltar preserva os ajustes salvos.

## Primeira inclusão no Canvas

A casa preparada é inserida sem repetir modais, defaults ou cálculos iniciais. A planta deve
reproduzir orientação, mestre, níveis, alturas e contraventamentos confirmados, inclusive remoções
explícitas de reforços automáticos.

O estado `fieldAnalysis.prepared` e as definições pendentes são consumidos somente quando a inclusão
é salva com sucesso. A casa passa a `inserted`, sem pendências. Falha de gravação restaura o
documento anterior e conserva a preparação para nova tentativa.

O metadado é opcional e usa o transporte atual do documento. Os dados estruturais permanecem nos
campos canônicos; registros sem o metadado mantêm o fluxo anterior. A prévia e as definições de
contraventamento não persistem instâncias Fabric. Autosaves anteriores são concluídos antes da
análise e suspensos enquanto ela está aberta.
