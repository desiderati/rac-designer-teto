---
title: "Bug Analysis - Texto da água branco após recarregar canvas"
doc_role: bug-analysis
status: confirmed
created: 2026-05-13
updated: 2026-05-13
supersedes:
superseded_by:
tags: [ bug-analysis, bug, regression, rac-editor, canvas ]
aliases: [ Texto da água branco após recarregar canvas ]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug analisado: rótulo do elemento `Água` perde a aparência original após sair e voltar para a casa
- origem do relato: QA do usuário
- ambiente: editor local/browser
- status analítico: confirmado
- estado da correção: validada
- status de evidência: validated-at-original-boundary

## 2. Contexto e Sintoma Observado

- contexto funcional: o elemento `Água / Rio` é um grupo Fabric com corpo em padrão de ondas e rótulo central.
- sintoma observado: após recarregar a casa/canvas, o texto da água aparece branco em vez de manter a leitura azul
  original.
- impacto percebido: perda de legibilidade e inconsistência visual em documento salvo.
- limitação inicial: o relato veio com evidência visual; a reprodução automatizada foi feita no limite documental do
  canvas.

## 3. Contrato de Falha Observável

- cenário original reportado: inserir água, sair da casa, voltar para a mesma casa e observar o rótulo da água.
- fronteira observável do relato: reload/hidratação do documento visual salvo no canvas.
- reprodução mínima que deve falhar antes da correção: exportar e reidratar um `waterLabel` com `fill`, `stroke`,
  `strokeWidth` e `paintFirst: 'stroke'`; o documento exportado não preservava `paintFirst`.
- cenário de controle: estilos já suportados, como `fill`, `stroke` e `strokeWidth`, devem continuar no round trip.
- evidência necessária para considerar resolvido: `paintFirst` precisa sobreviver ao ciclo canvas -> documento -> canvas
  e persistir depois de reload seguido de novo salvamento.

## 4. Escopo Afetado

- fluxos afetados: inserção de água, autosave da casa ativa, reload/hidratação do canvas.
- regras de negócio afetadas: consistência visual do canvas 2D.
- módulos envolvidos:
    - `src/components/rac-editor/@canvas/lib/factory/elements/water.strategy.ts`
    - `src/components/rac-editor/@canvas/ui/adapters/fabric-canvas-document-port.ts`
    - `src/shared/types/house-drawing-document.ts`
- contratos envolvidos: `HouseDrawingCanvasDocument` e adapter Fabric do `CanvasDocumentPort`.

## 5. Mapa de Camadas e Fronteiras

| Camada ou fronteira | Responsabilidade                                                            | Evidência disponível                                           | Status    |
|---------------------|-----------------------------------------------------------------------------|----------------------------------------------------------------|-----------|
| fábrica visual      | cria `waterLabel` com `fill` azul, `stroke` branco e `paintFirst: 'stroke'` | leitura de `water.strategy.ts`                                 | observado |
| adapter documental  | traduz Fabric para documento visual serializável                            | `styleKeys` não incluía `paintFirst`                           | observado |
| persistência        | salva clone do documento visual no registro da casa                         | `saveActiveHouseDrawingDocument` salva `document.canvas`       | observado |
| reload/hidratação   | reconstrói o runtime a partir do documento visual                           | teste e navegador validaram `paintFirst: 'stroke'` após reload | observado |

## 6. Fluxo Esperado vs. Fluxo Real

- fluxo esperado: o rótulo da água deve ser salvo com a ordem de pintura original para desenhar o contorno branco antes
  do preenchimento azul.
- fluxo real: o adapter salvava `fill`, `stroke` e `strokeWidth`, mas descartava `paintFirst`.
- ponto de divergência identificado: whitelist `styleKeys` do adapter documental.

## 7. Hipóteses Causais

| Hipótese                                       | Evidências a favor                                                                    | Evidências contra                                                 | O que ainda falta saber | Como validar                        | Status     |
|------------------------------------------------|---------------------------------------------------------------------------------------|-------------------------------------------------------------------|-------------------------|-------------------------------------|------------|
| `fill` do texto não era salvo                  | sintoma visual parecia texto branco                                                   | teste mostrou `fill: '#0092dd'` preservado                        | nada                    | inspecionar documento exportado     | descartada |
| `paintFirst` era perdido no round trip         | `waterLabel` depende de `paintFirst: 'stroke'`; `styleKeys` não listava a propriedade | nenhuma após teste vermelho                                       | nada                    | teste de round trip de `waterLabel` | confirmada |
| reload da casa trocava o objeto água por outro | sintoma acontece após troca/reload                                                    | persistência mantém o grupo `water`; divergência estava no estilo | nada                    | inspeção IndexedDB após reload      | descartada |

## 8. Evidências e Pontos Envolvidos

### Evidências observadas

- teste vermelho em `fabric-canvas-document-port.smoke.test.ts` mostrou ausência de `paintFirst` no documento exportado.
- navegador local validou `foundWater: true`, `text: 'Água'`, `fill: '#0092dd'`, `stroke: 'white'`,
  `strokeWidth: 2`, `paintFirst: 'stroke'` após inserir água.
- após reload da página, inserção de `Fossa` e novo autosave, o documento persistido continuou com
  `paintFirst: 'stroke'` no `waterLabel`.

### Pontos de código, contrato ou regra

- `water.strategy.ts`: define o comportamento visual correto do rótulo.
- `fabric-canvas-document-port.ts`: define quais estilos do Fabric entram no documento visual.
- `HouseDrawingCanvasDocument`: aceita `style` como objeto JSON, portanto não exigia mudança de schema.

## 9. Classe do Defeito ou Regressão

- classe: perda de propriedade visual em serialização/hidratação.
- por que se aplica: o runtime original estava correto; o defeito surgia ao atravessar o contrato documental.

## 10. Correção Aplicada

- menor mudança coerente: incluir `paintFirst` em `styleKeys`.
- por que resolve a causa: a ordem de pintura volta a ser exportada, persistida e reidratada pelo adapter.
- riscos e impactos laterais: baixo; a propriedade é JSON serializável e só amplia a fidelidade de estilo.

## 11. Validação Executada

- validação de camada:
    - `rtk npm run test -- fabric-canvas-document-port.smoke.test.ts --testTimeout 20000`
    - `rtk npm run test -- water.strategy.smoke.test.ts fabric-canvas-document-port.smoke.test.ts house-drawing-document.smoke.test.ts --testTimeout 20000`
- validação de integração:
    - `rtk npm run test:architecture`
    - `rtk npm run lint`
    - `rtk npm run build`
- validação na fronteira original:
    - navegador local em `http://127.0.0.1:5200/`: inserir água, confirmar documento persistido, recarregar a página,
      inserir fossa e confirmar que o novo autosave preservou `paintFirst: 'stroke'` no `waterLabel`.
- critério de sucesso observado: documento persistido da casa manteve `paintFirst: 'stroke'` antes e depois do reload.

## 12. Status de Evidência

- status final: validated-at-original-boundary
- por que este status se aplica: o ciclo de inserção, persistência, reload e novo salvamento foi exercitado em
  navegador,
  e o teste automatizado protege o ponto exato de perda documental.
- o que ainda ficaria necessário: nenhum bloqueio conhecido para este defeito específico.

## 13. Dúvidas Residuais de Regra de Negócio

- dúvida: nenhuma.
- por que ainda importa: não aplicável.

## 14. Artefatos Relacionados

- incidente correlato: não aplicável.
- PR, commit ou diff relacionado: diff local desta sessão.
- sidecar de anexos: não aplicável.
- documentos correlatos:
    - `docs/business-rules/BUS-001-canvas.md`
    - `docs/architecture-decisions/ADR-002-formato-canonico-projeto-rac.md`
