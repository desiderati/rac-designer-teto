---
title: Execução local com login Manus e imagens indisponíveis
doc_role: bug-analysis
status: resolved
created: 2026-10-16
updated: 2026-10-16
tags: [bug-analysis, local-runtime, imagens]
---

# Execução local e imagens da apresentação

## 1. Identificação
- Origem: relato humano com captura da apresentação local.
- Ambiente: local-only, 127.0.0.1:5200, main.
- Evidência final: validated-at-original-boundary.

## 2. Contexto e sintoma
O usuário esperava usar o editor local sem Manus. A página mostrava Entrar com Manus e duas
imagens quebradas. A reprodução no navegador Codex confirmou ambos os sintomas.

## 3. Contrato de falha observável
- dev:local deve abrir o editor isolado, com dados apenas neste navegador.
- As imagens públicas da apresentação devem carregar sem credenciais de storage.
- Controle: build e execução integrada continuam exigindo autenticação; fotos privadas não
  passam a ser públicas.
- Resolução: executar o comando real, recarregar a mesma origem, observar o editor e verificar
  as duas imagens por complete/naturalWidth no navegador.

## 4. Escopo afetado
scripts/run.mjs, alias dev:isolated em package.json, duas constantes da apresentação em RacEditor,
assets públicos, teste existente de autenticação e comandos do README. Sem mudança no backend,
credenciais, dados, schema, sincronização ou regras dos novos elementos.

## 5. Fronteiras observadas
| Fronteira | Evidência |
| --- | --- |
| Inicialização | Processo ativo vinha de scripts/run.mjs dev:local via tsx/Express |
| Perfil | isLocalEditorMode aceita MODE=isolated ou VITE_E2E=true |
| Imagens | Duas URLs /api/public-assets apontavam ao proxy de storage |
| HTTP | Proxy devolveu 500 Storage proxy not configured |
| Interface | Apresentação com imagens quebradas reproduzida no iab |

## 6. Fluxo esperado e divergência
dev:local compartilhava o ramo de inicialização integrado com dev. Apenas dev:isolated usava
Vite em modo isolated. Além disso, assets públicos de apresentação dependiam do Forge remoto.
A distinção do script e a dependência de storage explicam os dois sintomas independentemente.

## 7. Hipóteses causais
- Perfil incorreto para uso local: confirmado pelo processo, launcher e interface.
- Falta de configuração do proxy: confirmada pela resposta HTTP e fonte storageProxy.ts.
- Imagens corrompidas: descartada; originais públicos são PNGs válidos e carregaram após inclusão.
- Falha OAuth no provedor: não investigada; autenticar localmente não era o comportamento desejado.

## 8. Evidências e procedência
Originais obtidos em leitura pública no domínio canônico do sitemap.xml:
- https://tetopr.manus.space/api/public-assets/rac-editor-landing-screenshot-harmonized_95473d21.png
- https://tetopr.manus.space/api/public-assets/teto-house-linework-transparent-cropped_770579e2.png
Copiados sem edição para client/public/landing. Dimensões: 1438x1039 e 1958x1293.

## 9. Classe
Configuração de desenvolvimento ambígua e dependência remota desnecessária de assets públicos.

## 10. Correção
- Unificar dev:local e dev:isolated no launcher Vite isolated em loopback, porta fixa 5200.
- Preservar dev, e2e-server, build e start integrados.
- Servir as duas imagens via /landing, pelo próprio frontend, e ajustar o teste existente.
- Esclarecer no README que o Playwright inicia seu próprio servidor E2E e exige porta livre.

## 11. Controles e limites
- Porta ocupada falha com strictPort; não muda silenciosamente a origem dos dados locais.
- Não usar hostname como critério para desligar autenticação em builds integrados.
- Banco isolated existente preservado. Fotos privadas continuam no fluxo protegido anterior.
- Executar preview do build não equivale a dev:local: preview continua integrado e não inclui API.

## 12. Validação
- npm run dev:local: Vite declarou modo isolated em 127.0.0.1:5200.
- iab, mesma origem: editor abriu sem login e recuperou Validação de elementos e os desenhos.
- Preview do build em loopback 5201: ambas as imagens loaded=true com dimensões naturais acima.
  O aviso de sessão no preview sem API é esperado e não representa autenticação de produção.
- Cinco testes de apresentação/autenticação e oito do proxy de storage aprovados.
- TypeScript e build completo (Vite + backend) aprovados.
- Lint sem erros; aviso anterior de dependência eager em RacEditor.tsx:348 permanece.
- Build mantém aviso conhecido de chunks grandes. Sem suíte E2E completa ou publicação.

## 13. Status final
validated-at-original-boundary para acesso local e carregamento das duas imagens. Servidor
dev:local mantido para uso manual; preview temporário encerrado. Sem alteração remota.

## 14. Dúvidas residuais
Nenhuma no escopo corrigido. Login Manus em ambiente integrado não foi exercitado.

## 15. Artefatos relacionados
Capturas no sidecar local 20261016-execucao-local.work-item.assets: editor-local-sem-login.png
e landing-imagens-build.png. Resultado promovido ao changelog de 2026-10-16 e ao README.
