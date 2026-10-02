---
title: Exportação de RACs em ZIP
id: BUS-013
doc_type: business-rule
doc_role: business-rule
doc_set: business-rules
order: 13
status: active
lang: pt-BR
---

# Exportação de RACs em ZIP

## Objetivo

Definir a exportação em lote das RACs de uma Construção TETO para um arquivo ZIP.

## Regra Geral

1. A ação fica disponível no grupo de ícones de cada Construção TETO na listagem.

2. A exportação em ZIP só pode ocorrer para construção `Em andamento`, porque a geração altera
   status de casas.

3. Casas `Arquivadas` não entram na impressão das RACs.

4. Casas `Construídas` entram no ZIP, mas permanecem com status `Construída`.

5. Casas não construídas exportadas com sucesso mudam para `Impressa`.

6. O ZIP não deve ser baixado se nenhuma casa não arquivada estiver disponível.

## Falha Parcial

1. Falha em uma casa não deve impedir a geração das demais RACs.

2. Quando houver ao menos uma RAC gerada e ao menos uma falha, o ZIP deve incluir
   `ERROS_EXPORTACAO_RACS.txt`.

3. O relatório de falhas deve identificar a casa e a mensagem de erro.

4. Casas com falha não têm status alterado.

5. Se todas as casas candidatas falharem, o sistema deve exibir erro claro e não baixar ZIP vazio.

## Fonte dos Dados

1. Cada PDF deve usar os dados persistidos da casa correspondente.
2. A geração do modelo PDF deve aceitar `houseId` explícito para evitar depender da casa ativa.
3. A imagem 2D de cada RAC deve ser renderizada a partir do documento visual persistido da casa.
4. Cada PDF do lote deve incluir o snapshot 3D na segunda página, como a exportação individual.
5. Cor de parede e pose de câmera (posição, alvo, campo de visão e zoom) devem vir do documento da própria casa.
   Casas legadas sem configuração documental usam o enquadramento padrão; preferências locais legadas só podem
   ser consultadas pela identidade da mesma casa.
6. Se a captura 3D falhar, aquela casa entra no relatório de falhas; não exportar uma RAC silenciosamente incompleta.
7. A planta (vista superior) é obrigatória em cada casa, conforme o checklist da RAC. Validar antes
   de consultar o cache ou capturar imagens. Casa sem planta entra no relatório de falhas, com
   orientação para inseri-la; as demais casas válidas continuam a ser exportadas.

## Consistência Operacional

1. Antes de exportar, o documento ativo deve ser salvo quando houver alteração pendente.

2. O download bem-sucedido representa geração local do arquivo, não confirmação de impressão física.

3. O status só deve ser alterado após a geração do ZIP e apenas para casas exportadas com sucesso.

4. A nomenclatura dos PDFs dentro do ZIP deve continuar usando código da construção e nome da
   família, com tratamento de duplicidade quando necessário.
