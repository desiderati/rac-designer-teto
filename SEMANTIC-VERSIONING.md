# Versionamento Semântico

Este documento é o contrato padrão de versionamento do repositório. Regras locais mais específicas,
registradas em documentação ou configuração versionada, prevalecem sobre esta baseline.

## Formato

Use `MAJOR.MINOR.PATCH[-PRERELEASE]`:

- `MAJOR`: mudança incompatível em um contrato estável;
- `MINOR`: nova capacidade compatível com o contrato estável atual;
- `PATCH`: correção compatível e localizada;
- `PRERELEASE`: estágio ainda não estável, como `alpha`, `beta` ou `rc`.

Metadados de build, quando adotados pelo repositório, usam `+IDENTIFICADOR` e não alteram a
precedência da versão.

## Fonte de verdade

- identifique a fonte canônica da versão antes de editar: `VERSION`, manifesto de pacote, arquivo de
  projeto ou outro contrato explícito do repositório;

- trate versões expostas no `README.md`, no `CHANGELOG.md` ou em artefatos derivados como espelhos
  da fonte canônica e mantenha-os consistentes quando existirem;

- em monorepositórios, confirme se a versão pertence ao repositório inteiro ou a componentes
  independentes; não propague um bump entre pacotes por suposição;

- use o changeset que será commitado como unidade de versionamento; não acumule bumps intermediários
  para a mesma entrega.

Se o repositório não declarar uma fonte de verdade ou uma unidade de versionamento, não invente uma
política silenciosamente. Registre a lacuna e peça decisão quando ela afetar o resultado.

## Escolha da versão

- use `PATCH` para correções compatíveis, documentação pontual e refatorações internas sem mudança
  perceptível de contrato;

- use `MINOR` para capacidades novas e compatíveis ou para uma ampliação perceptível da superfície;

- use `MAJOR` para ruptura intencional de um contrato estável;

- trate promoção de estágio, como `beta` para `rc`, como uma decisão de versão explícita;

- atualize a versão uma única vez depois que o escopo do changeset estiver consolidado.

Regras locais podem exigir um bump diferente, adiar o bump para o fluxo de release ou restringir a
mudança de `MAJOR` a uma decisão humana explícita.

## Compatibilidade em versões beta

Enquanto a versão em trabalho tiver o identificador `beta`, o agente não precisa preservar
retrocompatibilidade por padrão. Ao modificar o repositório, prefira o contrato-alvo mais coerente
em vez de manter aliases, caminhos alternativos, campos obsoletos ou shims apenas para reproduzir
comportamentos de uma beta anterior.

Dentro de um changeset coeso, APIs, configurações, layouts e formatos ainda beta podem ser alterados
ou removidos, desde que os consumidores versionados no mesmo escopo sejam atualizados e a ruptura
seja registrada no changelog quando houver impacto observável.

Essa liberdade não autoriza:

- perda silenciosa de dados ou estado persistido;
- omissão de migração, recovery ou rollback quando houver estado existente a preservar;
- quebra de contrato externo explicitamente assumido pelo repositório;
- bypass de testes, validações, autorizações ou guardrails operacionais.

Quando uma mudança beta afetar dados, configuração persistida ou operadores já ativos, forneça o
caminho de migração necessário. Migração operacional e retrocompatibilidade permanente são
responsabilidades diferentes.

## Compatibilidade em versões estáveis

Para esta baseline, um contrato estável começa em `1.0.0` e não possui identificador de
pré-lançamento. Versões `0.y.z` permanecem em desenvolvimento inicial; a política local deve
declarar o nível de compatibilidade esperado nesse estágio.

Em versões estáveis, preserve retrocompatibilidade por padrão. Mudanças incompatíveis exigem
`MAJOR`, documentação clara do impacto e, quando aplicável, estratégia de depreciação ou migração.

## Fluxo do agente

1. Leia a fonte canônica da versão e as regras locais de release.
2. Determine se o contrato atual é beta ou estável.
3. Identifique contratos públicos, consumidores versionados e estado persistido afetados.
4. Consolide o changeset e escolha um único bump coerente.
5. Atualize a fonte canônica, seus espelhos e o changelog aplicável.
6. Execute os testes e as validações proporcionais ao impacto.
7. Registre incompatibilidades, migrações e limitações observáveis na entrega.

## Exemplos

- `0.8.1-beta` para `0.9.0-beta`: ampliar ou reformular uma capacidade ainda beta;
- `1.4.2` para `1.4.3`: corrigir comportamento sem romper o contrato estável;
- `1.4.2` para `1.5.0`: adicionar capacidade compatível;
- `1.4.2` para `2.0.0`: introduzir mudança incompatível em versão estável.
