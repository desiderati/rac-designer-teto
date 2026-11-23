## Corrigir validação do mesmo destino

O writer validava outro arquivo por usar cwd como raiz. A correção vincula raiz e entrada absolutas
e valida os mesmos bytes publicados. O histórico foi preservado.

- Validação: testes locais de destinos distintos e drift passaram.
- Evidência: work-item e recibo do owner; entrada ID/hash preservados no sidecar.

Este é um corpo sanitizado para `record`, sem frontmatter ou horário factual inventado. O agente
fixa ID, horário com fuso e título automaticamente antes da tentativa e envia o corpo em UTF-8 por
`--stdin`, sem criar arquivo temporário nem preparar candidato. Quando um arquivo existente for
necessário, usa `--body-file` com caminho físico absoluto validado, em vez de `--stdin`. Não combina
os argumentos nem relaxa as recusas de links, inclusive em aliases como `/tmp` no macOS. Uma
sequência de tentativas do mesmo problema fica em uma unidade; não crie uma entrada por comando.
