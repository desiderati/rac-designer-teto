---
title: Checklist de Exportação da RAC
id: BUS-012
doc_type: business-rule
doc_role: business-rule
doc_set: business-rules
order: 12
status: active
lang: pt-BR
---

# Checklist de Exportação da RAC

## Objetivo

Definir quais verificações o editor apresenta antes da exportação padrão de PDF da RAC.

## Regra Geral

1. A exportação padrão de PDF deve abrir um checklist antes de gerar o arquivo.
2. A geração do PDF só ocorre depois de confirmação explícita no checklist.
3. Cancelar o checklist não deve gerar PDF nem alterar status da casa.
4. A casa só muda para `Impressa` depois que o PDF é salvo com sucesso.

## Itens Obrigatórios

Itens obrigatórios bloqueiam a geração do PDF:

1. Existe Construção TETO ativa.
2. Existe casa ativa ou primeira casa não arquivada disponível.
3. A casa possui documento de desenho sincronizado.
4. A planta (vista superior) da casa está inserida no Canvas. Elevações isoladas não substituem a planta.
5. O tipo da casa está definido.

## Itens Recomendados

Itens recomendados não bloqueiam a geração, mas aparecem como alertas:

1. Nome da família.
2. Código da construção.
3. Comunidade.
4. Tamanho da casa.
5. Ao menos uma vista elevada, frontal, traseira ou lateral.
6. Exatamente um piloti mestre.
7. Altura e nível numéricos para todos os pilotis esperados.
8. Solo informado.
9. Data da construção.
10. Localização do terreno.
11. Contato principal da família.
12. Lideranças responsáveis.
13. Ao menos um monitor ativo.
14. Justificativa preenchida quando houver material extra com quantidade maior que zero.

## Consistência

1. O checklist deve avaliar a mesma casa que será usada pelo modelo do PDF.

2. O checklist pode usar dados persistidos após salvar o documento ativo, para evitar alertas
   causados por estado visual ainda não sincronizado.

3. Alertas não devem impedir a geração, pois parte dos campos é operacionalmente opcional.

4. Sem planta, o checklist bloqueia a geração antes de abrir a prévia, consultar o cache ou
   capturar imagens. Orientação exibida: `Insira a planta (vista superior) da casa no Canvas antes de gerar o PDF.`

5. No editor, a confirmação e a tentativa posterior devem revalidar o documento atual e a presença
   da planta no estado corrente do Canvas. Se a casa ativa mudar, exigir revisão do checklist.

6. A mesma exigência de planta vale para a impressão individual pela listagem e para cada casa no ZIP.
   Falha técnica de captura 3D com planta presente continua sendo erro, sem gerar PDF incompleto.

## Conteúdo padrão do PDF

1. O PDF deve adicionar a observação padrão de materiais extras depois da justificativa digitada
   pelo usuário: `Os materiais extras relacionados podem sofrer alterações ao longo da construção,
   conforme a evolução dos trabalhos e as necessidades identificadas durante a CC.`

2. O PDF deve adicionar a observação geral padrão da casa/RAC depois das observações digitadas pelo
   usuário: `A RAC é uma referência inicial para a construção da casa e pode sofrer alterações ao
   longo da CC. Adequações na posição da casa e remanejamento dos pilotis podem ocorrer em alguns
   casos.`

3. Esses textos padrão pertencem ao relatório gerado e não devem aparecer nos formulários, ser
   editáveis ou ser persistidos como texto do usuário.

4. A observação padrão de materiais extras não satisfaz o item recomendado de justificativa
   preenchida quando houver material extra com quantidade maior que zero.
