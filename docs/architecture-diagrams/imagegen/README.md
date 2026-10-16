# RAC Designer TETO — imagens da arquitetura

Três imagens geradas com a ferramenta integrada **imagegen** em 16/10/2026. Os Mermaid
de [architecture-diagrams](../README.md) continuam sendo a fonte canônica e permaneceram
intactos, incluindo seu README e ajustes manuais. Nenhum arquivo existente foi substituído.

## Imagens finais

| Visão                | PNG                                      | Dimensões   | Revisão                                                                                                                            |
|----------------------|------------------------------------------|-------------|------------------------------------------------------------------------------------------------------------------------------------|
| Arquitetura macro    | [macro.png](02-camadas-e-modulos.png)    | 1774 × 887  | 12 componentes; 15 relações (6 internas e 9 integrações). Conexões externas 3–9 descritas na legenda, com endpoints identificados. |
| Camadas e módulos    | [camadas.png](01-arquitetura-macro.png)  | 1536 × 1024 | 15 módulos em quatro camadas do mesmo navegador; 19 relações explícitas por identificadores.                                       |
| Dados e persistência | [dados.png](03-dados-e-persistencia.png) | 1536 × 1024 | 11 elementos e 11 relações; escrita do documento, imagens, usuários e retorno de conflito.                                         |

## Fidelidade e leitura

A revisão do agente comparou cada candidata com o Mermaid correspondente: componentes, fronteiras, direções, protocolos
e nomes técnicos. As versões com conectores trocados foram rejeitadas; os resultados finais acima são as versões
corrigidas. As relações de implementação da visão de camadas têm a descrição “implementado por”; não significam
dependência do domínio de uma implementação concreta.

A composição favorece cartões frontais e texto legível. Na macro e nas camadas, a legenda é parte obrigatória da imagem:
algumas relações são expressas ali para evitar destinos visuais ambíguos. Não se deve recortar essa legenda ao usar as
imagens. A revisão visual foi feita nas imagens exibidas em tamanho natural; ao reduzir para uma coluna estreita, abra o
PNG ou use zoom para ler detalhes. Não foi realizado aceite independente humano nem comprovada legibilidade em qualquer
tamanho de exibição.

A referência visual foi usada somente para fundo claro, cores suaves e tratamento dos blocos. Nenhum componente GCP da
referência foi incorporado à arquitetura. Não houve geração por CLI nem uso de chave de API configurada pelo operador.
