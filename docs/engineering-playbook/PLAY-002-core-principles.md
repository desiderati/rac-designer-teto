---
title: Princípios Centrais de Engenharia
id: PLAY-002
doc_type: playbook
doc_role: engineering-playbook
doc_set: engineering-playbook
family: core
precedence: 2
status: active
lang: pt-BR
---

# Princípios Centrais de Engenharia

## Objetivo

Este documento define os princípios fundamentais que guiam todas as decisões de desenvolvimento no
repositório. Eles representam a filosofia de engenharia esperada para qualquer intervenção relevante
no código.

## Reutilizar antes de construir

Antes de criar qualquer componente, hook ou função nova, audite a base existente em busca de uma
solução reutilizável. Duplicação de código é o principal inimigo a ser combatido. Criar algo novo é
último recurso, não o primeiro.

## Fluxo obrigatório de decisão

Antes de escrever qualquer código de feature ou refatoração, siga esta sequência:

1. Defina o problema em uma única frase, combinando sintoma e impacto no negócio.
2. Faça um inventário do código existente com busca global e registre a evidência encontrada.
3. Classifique a lógica localizada entre o que é comum e o que é específico de domínio.
4. Aplique a matriz de decisão deste documento.
5. Só então implemente.

## Matriz de decisão

### Quando reutilizar

- O comportamento desejado já existe e a diferença é apenas de dados, texto, estilo ou props
  simples.

- O contrato de interação já é idêntico.

- A ação correta é estender a API do componente ou hook existente com a menor superfície de mudança
  possível.

### Quando extrair

- Já existe duplicação de lógica ou estrutura em dois ou mais pontos.

- Há chance concreta e imediata de um terceiro uso.

- O fluxo-base é o mesmo e apenas a regra de domínio final muda.

- A ação correta é extrair a parte comum para componente ou hook compartilhado e manter a regra
  específica no consumidor.

### Quando criar

- A auditoria comprova que não existe implementação equivalente.
- A natureza da interação ou do domínio é fundamentalmente diferente.
- Reutilizar forçaria acoplamento ruim ou abstração excessiva.
- A ação correta é criar um novo módulo com justificativa explícita para não reutilizar nem extrair.

## Passos pequenos, incrementais e validados

Toda mudança deve ser a menor unidade lógica possível. Após cada passo relevante, execute as
validações compatíveis com o escopo, como testes, lint ou type-check. Não agrupe múltiplas frentes
de refatoração ou feature num único bloco grande de mudança.

## Clareza antes de abstração prematura

Prefira código fácil de ler e entender. Uma abstração só se justifica quando atende imediatamente a
pelo menos dois dos critérios abaixo:

1. Elimina duplicação de lógica crítica já existente.
2. Reduz acoplamento problemático já existente.
3. Permite troca real de implementação no curto ou médio prazo.
4. Melhora significativamente a testabilidade de um comportamento central.

Se esses critérios não forem atendidos, mantenha a solução direta.

## Fonte única de verdade

Regras de negócio, constantes, configurações de escala, mapeamentos e demais informações
compartilhadas devem viver em um único ponto canônico. Espalhar defaults ou regras em múltiplos
arquivos é proibido.

## Compatibilidade incremental

Ao refatorar estruturas de dados, tipos ou serialização, preserve compatibilidade com o formato
legado durante a transição. A leitura deve suportar formato novo e antigo. A escrita deve convergir
para o formato novo. Breaking changes silenciosos em dados existentes são inaceitáveis.

## Antipadrões proibidos

- Criar componente ou hook novo sem auditoria prévia de reutilização.
- Copiar e colar lógica de UI ou fluxo para acelerar entrega.
- Introduzir abstração complexa para necessidade apenas hipotética.
- Espalhar constantes, defaults ou regras de negócio em múltiplos arquivos.
- Corrigir UI sem validar que o contrato funcional e de interação continua intacto.
