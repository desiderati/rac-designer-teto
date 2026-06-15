# CONTRIBUTING.md

Este arquivo define a convenção mínima de contribuição distribuída pelo `agents-bootstrap`.

Se o repositório tiver regras explícitas para branches, pull requests, releases, CI/CD ou idioma, as regras locais
prevalecem sobre este documento.

## Escopo e precedência

- use este arquivo como baseline quando o repositório ainda não tiver um contrato equivalente
- se `README.md`, `docs/`, `AGENTS.md` ou outra documentação canônica trouxerem regras mais específicas, siga a fonte
  local
- este arquivo não fixa estratégia de branches, plataforma de hospedagem, política de merge ou stack de CI/CD

## Mensagens de commit

As mensagens de commit devem seguir sempre o padrão Conventional Commits e ser escritas em português do Brasil.

### Regras

- não seja verboso; evite contexto, justificativa, narrativa, opinião ou detalhes desnecessários
- não envolva a mensagem em aspas
- não termine linhas com espaço
- sempre que fizer sentido, derive o tipo e o escopo a partir do nome da branch atual
- se não houver derivação clara pela branch, use um escopo curto relacionado ao todo da mudança, por exemplo
  `feat(config)`

Exemplos:

- branch `feature/CRON-1000-blah-blah` -> `feat(CRON-1000): resumo curto do que foi feito`
- branch `bugfix/CRON-1001-blah-blah` -> `fix(CRON-1001): resumo curto do que foi feito`

### Como extrair dados da branch atual

- `scope`: use o identificador do ticket em maiúsculas, por exemplo `CRON-1000`
- mapeamento de `type`:
  - `feature/*` -> `feat`
  - `fix/*`, `bugfix/*` ou `hotfix/*` -> `fix`
  - `chore/*` -> `chore`
  - `refactor/*` -> `refactor`
  - `docs/*` -> `docs`
  - `test/*` -> `test`
  - `perf/*` -> `perf`
  - `ci/*` -> `ci`
  - `build/*` -> `build`

## Formato de saída

- se a mudança for pequena e coesa, use uma única linha
- se a mudança for ampla ou misturada, use uma linha de resumo e depois bullets só com os pontos principais
- se usar corpo com bullets, use exatamente uma linha em branco entre o resumo e o primeiro bullet, e nenhuma linha em
  branco entre bullets consecutivos
- em listas com bullets, mantenha cada linha com no máximo 100 caracteres

### Exemplo coeso

```text
feat(CRON-1000): adicionar validação de regras no agendamento
```

### Exemplo amplo

```text
chore(CRON-1000): adicionar validação de regras no agendamento

- atualizar variáveis de ambiente.
- corrigir fluxo de retry no worker.
- ajustar logs e métricas principais.
```

## Estilo de redação

- use verbos no infinitivo, como `adicionar`, `corrigir`, `remover`, `ajustar` e `refatorar`
- evite termos vagos como `melhorias` ou `ajustes`, a menos que a lista subsequente torne o agrupamento explícito

## Pull Requests

Pull Requests devem ser escritos em português do Brasil, com foco em facilitar a revisão técnica.

### Título

- use um título curto em estilo Conventional Commits
- derive o `type` e o `scope` a partir do nome da branch quando possível
- preserve o identificador do ticket em maiúsculas

Exemplos:

- branch `feature/CRON-1000-blah-blah` -> `feat(CRON-1000): resumo curto da mudança`
- branch `bugfix/CRON-1001-blah-blah` -> `fix(CRON-1001): resumo curto da correção`

### Descrição

A descrição deve conter, quando aplicável:

- contexto da mudança
- principais alterações realizadas
- como a mudança foi validada
- riscos, impactos ou pontos de atenção
- observações úteis para revisão

Evite descrições genéricas como `ajustes`, `correções diversas` ou `melhorias`.
Se algo não foi validado, informe isso explicitamente em vez de presumir.

### Validação

Inclua comandos, testes, evidências manuais ou verificações realizadas.

Exemplos:

```text
- npm test
- python -m unittest discover
- validação manual do fluxo de criação de usuário
```

### Riscos e observações

- informe mudanças de contrato, migrações, impactos operacionais ou dependências externas
- se o risco aparente for baixo, use uma formulação factual, como `baixo risco identificado pelo diff`
- não declare `sem risco` quando isso não puder ser sustentado por evidência
