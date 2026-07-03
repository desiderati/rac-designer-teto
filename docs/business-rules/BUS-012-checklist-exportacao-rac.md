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
4. A casa só muda para `RAC Impressa` depois que o PDF é salvo com sucesso.

## Itens Obrigatórios

Itens obrigatórios bloqueiam a geração do PDF:

1. Existe Construção TETO ativa.
2. Existe casa ativa ou primeira casa não arquivada disponível.
3. A casa possui documento de desenho sincronizado.
4. Ao menos uma vista da casa está inserida no canvas.
5. O tipo da casa está definido.

## Itens Recomendados

Itens recomendados não bloqueiam a geração, mas aparecem como alertas:

1. Nome da família.
2. Código da construção.
3. Comunidade.
4. Tamanho da casa.
5. Vista planta.
6. Ao menos uma vista elevada, frontal, traseira ou lateral.
7. Exatamente um piloti mestre.
8. Altura e nível numéricos para todos os pilotis esperados.
9. Solo informado.
10. Data da construção.
11. Localização do terreno.
12. Contato principal da família.
13. Lideranças responsáveis.
14. Ao menos um monitor ativo.
15. Justificativa preenchida quando houver material extra com quantidade maior que zero.

## Consistência

1. O checklist deve avaliar a mesma casa que será usada pelo modelo do PDF.

2. O checklist pode usar dados persistidos após salvar o documento ativo, para evitar alertas
   causados por estado visual ainda não sincronizado.

3. Alertas não devem impedir a geração, pois parte dos campos é operacionalmente opcional.
