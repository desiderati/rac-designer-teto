# RAC Editor - Architectural Standards (Reuse Before Build)

## Objetivo

Padronizar a tomada de decisão arquitetural para evitar criação de funcionalidades paralelas quando já existe base
reutilizável no projeto.

## Escopo

Estas regras valem para:

1. Novas features.
2. Ajustes de comportamento.
3. Refatorações de UI/hooks/factory.
4. Correções de regressão em fluxos existentes.

## Princípios obrigatórios

1. Reutilização antes de criação.
2. Composição antes de duplicação.
3. Simetria entre criação e edição de objeto (factory e apply devem convergir).
4. Compatibilidade incremental para formatos legados.
5. Mudança pequena, validação rápida e registro explícito.

## Diretriz de senioridade técnica do solicitante

Este projeto deve assumir perfil de decisão sênior (20+ anos de experiência), com preferência explícita por:

1. Eliminar duplicação estrutural assim que houver sinal de repetição.
2. Extrair componentes/hooks/comportamentos compartilhados para virar base de conhecimento reutilizável.
3. Evitar solução "remendo local" quando houver oportunidade clara de evolução arquitetural segura.
4. Priorizar transferência de conhecimento arquitetural para o repositório em vez de repetir decisões ad hoc a cada sessão.

## Fluxo decisório obrigatório (antes de codar)

1. Definir problema em 1 frase: sintoma + impacto.
2. Levantar implementações similares no código com `rg`.
3. Classificar:
    - comum (pode virar base compartilhada);
    - específico (permanece no módulo de domínio).
4. Aplicar a ordem de decisão:
    - Reutilizar.
    - Estender.
    - Extrair comum.
    - Criar novo (somente se os itens anteriores falharem).
5. Registrar em PR/commit a razão da escolha.

Se o passo 2 não foi feito, a implementação é considerada incompleta.

## Matriz: reutilizar, extrair ou criar

### Reutilizar

Use quando:

1. A interação é igual.
2. A diferença é texto, estilo ou pequenas props.

Ação:

1. Estender API existente com menor superfície possível.

### Extrair comum

Use quando:

1. Existe duplicação em 2+ pontos.
2. Há chance real de terceiro uso.

Ação:

1. Extrair shell comum.
2. Manter regra de negócio no consumidor.

### Criar novo

Use somente quando:

1. A interação é de outra natureza.
2. Reuso geraria acoplamento pior.
3. Não há base equivalente após inventário.

Obrigatório:

1. Documentar por que não foi possível reutilizar.

## Padrões por camada

### UI e editores

1. Reaproveitar shell (abertura/fechamento, confirmar/cancelar, layout desktop/mobile).
2. Componentes específicos devem conter apenas regras de domínio.
3. Evitar duplicação de markup estrutural entre editores.

### Hooks

1. Separar fluxo transversal (draft, persistência, histórico) de regra específica.
2. Evitar hooks “god object” com múltiplas responsabilidades.
3. Priorizar funções puras para regras reutilizáveis.

### Canvas e factory

1. Defaults e normalização geométrica em ponto único.
2. Estrutura criada no factory deve ser compatível com o fluxo de edição.
3. Ajustes de cor/label devem suportar estrutura aninhada quando aplicável.

### Domínio e persistência

1. Não introduzir camadas abstratas sem caso real.
2. Manter contrato explícito entre estado de domínio e renderização.
3. Compatibilidade com legados deve ter fallback de leitura durante transição.

## Regra de compatibilidade (legado)

Quando houver mudança de tipo/campo:

1. Ler formato novo e legado por período de transição.
2. Escrever no formato atual.
3. Evitar breaking change silenciosa em dados existentes.

## Protocolo de validação mínima

Para qualquer mudança arquitetural:

1. Rodar teste focado do fluxo alterado.
2. Rodar build.
3. Rodar lint/tipagem conforme viável.
4. Se houver passivo preexistente fora de escopo, registrar explicitamente.

## Anti-padrões proibidos

1. Criar novo componente/hook sem inventário prévio.
2. Copiar/colar fluxo de edição para “entregar rápido”.
3. Corrigir UI sem validar contrato funcional.
4. Introduzir abstração por hipótese futura sem demanda atual.
5. Espalhar constantes/valores padrão em múltiplos arquivos.
6. Criar encadeamento de funções/wrappers sem ganho real de legibilidade, redução de código ou variação de regra.

## Checklist obrigatório de PR

1. Qual problema real está sendo resolvido?
2. Quais implementações similares foram encontradas?
3. O que foi reutilizado e por quê?
4. O que foi extraído e por quê?
5. O que permaneceu específico e por quê?
6. Quais validações foram executadas?
7. Há risco de regressão? Onde?

## Evidência mínima esperada em descrição técnica

1. Comandos de inventário usados (ex.: `rg -n "..." src`).
2. Lista curta dos arquivos comparados.
3. Decisão arquitetural final (reutilizar, extrair ou criar).
4. Resultado de validação do fluxo impactado.

