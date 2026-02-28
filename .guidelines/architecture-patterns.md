# RAC Editor - Architectural Patterns (Reuse Before Build)

## Objetivo

Definir um padrão obrigatório para evoluir o sistema sem criar funcionalidades paralelas desnecessárias, priorizando
reutilização, composição e simplificação arquitetural.

## Princípios obrigatórios

1. Reuse-first: antes de criar algo novo, auditar o que já existe no código.
2. Simplificação pragmática: manter abstrações apenas quando há ganho real imediato.
3. Compose-over-copy: extrair componente/hook comum em vez de duplicar fluxo.
4. One source of truth: regras compartilhadas (constantes, estilo, escala, mapeamentos) em um único ponto.
5. Compatibilidade incremental: preservar comportamentos legados críticos durante refatorações.
6. Validação contínua: validar build/testes por etapa, não apenas ao final.

## Fluxo decisório obrigatório (antes de codar)

1. Definir o problema em 1 frase (sintoma + impacto).
2. Inventariar implementações similares no projeto.
3. Classificar o que é comum vs. específico de domínio.
4. Decidir entre reutilizar, extrair comum ou criar novo.
5. Só então implementar.

### Comandos recomendados para inventário

```powershell
rg -n "termoDoComportamento" src
rg --files src | rg "editor|factory|manager|strategy|modal|hook"
```

Se não houver evidência de busca no código, a implementação deve ser bloqueada até o inventário ser feito.

## Matriz de decisão arquitetural

### Reutilizar implementação existente

Use quando:

1. O comportamento já existe e difere apenas em texto, estilo ou pequenas props.
2. O contrato de interação é o mesmo (ex.: abrir/editar/confirmar/cancelar).

Ação:

1. Ajustar API por extensão mínima de props.
2. Evitar novo componente/hook paralelo.

### Extrair componente/hook comum

Use quando:

1. Há repetição em 2 pontos com chance concreta de terceiro uso.
2. O fluxo base é igual, mudando apenas regra de domínio.

Ação:

1. Extrair shell comum.
2. Manter regra específica no consumidor.

### Criar algo novo

Use apenas quando:

1. Não existe implementação equivalente após auditoria.
2. Há diferença real de domínio/interação.
3. Reutilização forçaria acoplamento pior do que o custo de um novo módulo.

Obrigatório:

1. Documentar por que não foi possível reutilizar.

## Padrões por camada

### UI (componentes e modais)

1. Estrutura de container (Dialog/Drawer, header/footer, ações) deve ser compartilhada.
2. Componentes especializados só recebem e aplicam regras de domínio.
3. Evitar duplicar markup e estado de abertura/fechamento em cada editor.

### Hooks

1. Hook comum para fluxo transversal (draft, confirmação, histórico, seleção).
2. Hook específico para regra de tipo (ex.: Linha, Seta, Piloti).
3. Não concentrar múltiplas responsabilidades em um único hook extenso.

### Canvas/factory

1. Regras geométricas compartilhadas (escala, normalização, defaults) em helpers únicos.
2. Criação e edição devem reutilizar a mesma regra base para evitar divergência.
3. Estratégias por vista/tipo são preferíveis a `switch` grande quando já há variação estável.

### Domínio e persistência

1. Evitar camadas anêmicas sem benefício imediato.
2. Port/Adapter apenas quando prepara evolução concreta (ex.: persistência futura).
3. Implementação inicial simples (ex.: memória) é válida quando reduz complexidade agora.

## Regras para novas abstrações

Criar `Port`, `Strategy`, `Factory` ou `Aggregate` somente se atender a pelo menos 2 critérios:

1. Reduz acoplamento crítico já existente.
2. Permite troca real de implementação no curto/médio prazo.
3. Elimina duplicação relevante de lógica.
4. Melhora testabilidade de comportamento central.

Se não atender, manter solução direta e simples.

## Regras de compatibilidade

1. Ao tocar em serialização/tipagem, manter suporte a objetos legados enquanto necessário.
2. Ao renomear campos/tipos, prever fallback de leitura durante transição.
3. Mudanças de comportamento visual devem preservar contrato funcional existente.

## Qualidade e validação mínima

Para qualquer mudança estrutural:

1. Rodar testes de fumaça do fluxo alterado.
2. Rodar build.
3. Rodar checagem de tipos quando houver impacto em tipagem/contratos.

Se lint/tsc falhar por passivo preexistente fora do escopo, registrar explicitamente.

## Anti-padrões (proibidos)

1. Criar novo componente sem auditar reutilização prévia.
2. Copiar/colar lógica de editor para acelerar entrega.
3. Corrigir UI sem validar contrato de interação.
4. Introduzir abstração por “prevenção futura” sem necessidade concreta.
5. Espalhar constantes e defaults em múltiplos arquivos.

## Checklist de PR (obrigatório)

1. Foi feita auditoria com busca no código?
2. Existe algo similar que foi reutilizado?
3. O que foi extraído como comum e por quê?
4. O que permaneceu específico e por quê?
5. Quais validações foram executadas?
6. Existe risco de regressão? Onde?

## Estratégia de evolução contínua

1. Consolidar primeiro os fluxos com maior duplicação.
2. Extrair comuns pequenos e estáveis.
3. Migrar consumidores em etapas curtas.
4. Remover código órfão apenas após cobertura mínima de validação.

## Governança operacional

1. Para processo incremental (fases, passos, validação obrigatória, atualização de `.rules`/`.codex`/`CHANGELOG`),
   seguir também: `.guidelines/governance.md`.
