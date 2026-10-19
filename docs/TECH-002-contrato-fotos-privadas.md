---
title: Contrato de referências de fotos e salvamento
id: TECH-002
doc_role: technical-note
doc_type: reference
status: active
lang: pt-BR
created: 2026-10-18
updated: 2026-10-18
tags: [fotos, formularios, correction-pattern]
---

# Contrato de referências de fotos e salvamento

## Contexto

Upload, formulário e normalização da sessão devem concordar sobre o formato de uma foto. Concluir o
upload não comprova que o formulário aceitou a referência nem que ela será preservada na reabertura.
A migração para storage privado expôs essa diferença ao bloquear a criação da casa antes de chamar o
salvamento, sem mostrar o erro do campo da foto.

## Formatos aceitos

O helper compartilhado photo-data-url.ts define o contrato atual:

| Representação                                                             | Validação e persistência                                             |
|---------------------------------------------------------------------------|----------------------------------------------------------------------|
| Rota privada relativa iniciada por `/api/private-storage/` e chave válida | Aceitar no formulário e preservar na normalização                    |
| Rota relativa legada iniciada por `/manus-storage/` e chave válida        | Manter compatibilidade de leitura e preservação                      |
| DataURL PNG, JPEG ou WebP                                                 | Aceitar somente com base64, assinatura compatível e limite do helper |
| Foto opcional vazia                                                       | Aceitar ausência; a normalização representa ausência como undefined  |
| URL externa, rota não admitida ou referência incompleta                   | Rejeitar; não ampliar o contrato apenas para fazer o envio passar    |

Os exemplos de prefixo acima descrevem formatos, não arquivos locais. A validação exata da chave e
da imagem pertence ao helper; novos formatos exigem revisão dos consumidores. Aceitação do formato
não comprova existência da imagem ou autorização para acessá-la.

## Fronteiras que devem permanecer coerentes

1. O storage retorna a rota privada da aplicação. A URL assinada usada internamente para acesso ao
   storage não deve substituir essa referência persistida.

2. Os schemas do formulário aceitam os formatos definidos pelo helper compartilhado.

3. A criação, a edição e a normalização da sessão preservam referências válidas, incluindo as
   privadas e as legadas.

4. A interface reabre o registro e apresenta a foto depois de salvar e recarregar.

Ao mudar uma rota, revisar as quatro fronteiras e os usos em fotos de construção, família e monitor.
A migração não está completa se o upload aceita a rota e o resolver ou a normalização a descarta.

## Feedback no formulário da casa

O erro da foto deve chegar ao controle com identificação acessível e integrar a abertura da seção e
o foco no primeiro erro. Um resumo junto ao botão de salvar informa o bloqueio mesmo quando o campo
estava em seção recolhida. Avisos de otimização ou sucesso do upload não substituem esse feedback.

Rejeição assíncrona do salvamento mantém o preenchimento, informa a falha e permite tentar
novamente. Enquanto salva, o botão indica o andamento e impede novo envio. As regras visuais estão
na [UI-003](ui-definitions/UI-003-acoes-responsivas-de-formularios.md).

## Diagnóstico e validação

Quando salvar não produz resultado, verificar primeiro se o resolver chamou o callback. Se ele
bloqueou, conferir formato da referência, erro do campo e estado da seção; notificações globais
funcionarem não prova que esse erro foi renderizado.

Cobrir criação e edição com rota privada, compatibilidade legada, foto inválida em seção recolhida,
ausência de foto e rejeição assíncrona. Conferir a referência no registro persistido e a foto na
reabertura após recarga. Usar fixtures sintéticas com o contrato do servidor, preservando a
privacidade das fotos recebidas em relatos. Ver
[PLAY-104](engineering-playbook/PLAY-104-frontend-testing.md).

## Fontes duráveis

- [Retorno do storage](../server/storage.ts).

- [Validação e normalização compartilhadas](../client/src/shared/lib/photo-data-url.ts).

- [Schemas de
  formulário](../client/src/components/construction-site/lib/construction-site-form-validation.ts).

- [Normalização e operações da
  sessão](../client/src/components/rac-editor/lib/construction-site-session.ts).

- [Formulário e feedback da
  casa](../client/src/components/construction-site/ui/HouseConfigurationScreen.tsx).

- [Regressão de criação e edição com foto](../e2e/house-save-regression.spec.ts).

- [Análise do
  caso](../.agents/bug-analysis/2026-10/20261017-criacao-casa-foto-privada.bug-analysis.md).
