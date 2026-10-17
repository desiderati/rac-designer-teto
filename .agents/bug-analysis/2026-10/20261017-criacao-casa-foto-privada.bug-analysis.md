---
title: "Criação de casa bloqueada por foto privada sem mensagem"
doc_role: bug-analysis
status: confirmed
created: 2026-10-17
updated: 2026-10-17
tags: [bug-analysis, bug, regression]
---

# Criação de casa bloqueada por foto privada sem mensagem

## 1. Identificação

- Origem: vídeo fornecido pelo usuário; 83 segundos, sem trilha de áudio.
- Relato no ambiente publicado; diagnóstico, correção e validação locais.
- Estado: aplicada e validada em testes; evidência `fixed-in-test`.

## 2. Contexto e sintoma

O vídeo mostra preenchimento da casa com foto da família e fotos do terreno, seguido de
tentativas de salvar sem concluir o formulário. Avisos de otimização e descrição de fotos
aparecem, indicando que a superfície geral de notificações funciona.

## 3. Contrato de falha observável

- Reprodução: preencher nome da família e contato, carregar foto cujo upload retorna
  `/api/private-storage/...` e salvar.
- Antes: o resolver impede `onSave`, mas não há mensagem para o erro da foto.
- Controle: formulário válido sem foto continua salvando, inclusive com seções mobile fechadas.
- Sucesso: criação, retorno à listagem e preservação da foto após recarga; erros visíveis.

## 4. Escopo afetado

Formulário da casa, validação compartilhada de fotos e normalização da sessão. A correção
central também mantém referências privadas usadas por construções e monitores.

## 5. Camadas e fronteiras

| Fronteira | Evidência | Status |
|---|---|---|
| Upload | `server/storage.ts` retorna `/api/private-storage/` | Observado na fonte |
| Formulário | `houseConfigurationFormSchema` rejeita essa referência | Reproduzido |
| Feedback | `familyPhotoDataUrl` não passava `fieldState.error` ao controle | Reproduzido |
| Persistência | `normalizeOptionalPhotoDataUrl` descartava a mesma referência | Reproduzido em teste |
| Publicação | Nenhuma execução ou alteração remota | Não verificado |

## 6. Fluxo esperado e real

Esperado: upload retorna referência privada, validação aceita, sessão persiste e listagem abre.
Real: o upload termina, mas a validação ainda admite apenas `/manus-storage/` e DataURLs.
O envio é interrompido antes da criação. A foto permanece na tela sem mensagem de validação.

## 7. Hipóteses causais

| Hipótese | Resultado e base |
|---|---|
| Incompatibilidade da rota de foto | Confirmada com resposta simulada igual ao contrato do servidor |
| Erro da foto sem renderização | Confirmada com referência inválida e seção recolhida |
| Notificações globalmente indisponíveis | Não sustentada: o próprio vídeo mostra avisos de upload |
| Exceção assíncrona específica no caso real | Sem evidência; adicionada cobertura de feedback para essa fronteira |

## 8. Evidências

- Antes: 3 testes falharam e 12 controles passaram; rejeição da rota nova, criação não chamada
  e ausência do erro de foto.
- Depois: 163 testes aprovados em 8 arquivos relacionados.
- Quatro E2E novos aprovados: criação e edição com foto privada em 390 e 1280 px,
  incluindo leitura do IndexedDB e recarga. Upload e imagens usam fixtures sintéticas.
- Dois E2E existentes de configuração e materiais também passaram.

## 9. Classe do defeito

Migração incompleta do contrato de imagem privada, combinada com validação sem feedback.

## 10. Correção aplicada

- Aceitar a rota privada atual e a rota legada no validador compartilhado.
- Preservar ambas as referências na normalização dos registros.
- Exibir erro da foto com `aria-invalid`, descrição associada e integração ao foco existente.
- Exibir resumo de validação junto à ação de salvar.
- Tratar rejeição assíncrona, manter o preenchimento e bloquear novo envio enquanto salva.

## 11. Cenários de controle

DataURLs continuam aceitos; URLs externas, outras rotas e referências vazias/incompletas
continuam rejeitadas. Sem foto e com seções opcionais fechadas, o formulário salva normalmente.
Falha assíncrona informa o problema e permite nova tentativa sem perder o preenchimento.

## 12. Validação executada

- Vitest: 163 testes em 8 arquivos.
- Playwright: 4 cenários novos aprovados e 2 existentes aprovados.
- TypeScript da aplicação e dos E2E: aprovado.
- ESLint nos arquivos alterados: sem erros; aviso preexistente de Fast Refresh em `shared-controls.tsx`.
- Diff dos arquivos produtivos: sem erros de whitespace.
- Primeira execução E2E revelou fixture sem mock de upload; corrigida a fixture, sem mudar
  autenticação ou comportamento do produto para passar no teste.

## 13. Status de evidência

`fixed-in-test`: reprodução e correção na interface local com o contrato real de URL.
O vídeo não contém requisições de rede; a causa do caso publicado é compatível com a reprodução,
mas a instância publicada não foi exercitada nem atualizada nesta tarefa.

## 14. Dúvidas residuais

Nenhuma dúvida de regra de negócio impede a correção. Publicação e aceite no ambiente publicado
permanecem etapas externas ao escopo local.

## 15. Artefatos relacionados

- `client/src/components/construction-site/ui/HouseConfigurationScreen.regression.test.tsx`
- `client/src/shared/lib/photo-data-url.smoke.test.ts`
- `e2e/house-save-regression.spec.ts`
- `.agents/work-items/2026-10/20261017-criacao-casa-formulario.work-item.md`
- `.agents/changelogs/2026-10/20261017.changelog.md`

Não foram incorporadas fotos pessoais do vídeo aos testes ou ao registro versionado.
