# GIT AND CI/CD

<ruleset name="Git and CI/CD">

<description>
Regras para o fluxo de trabalho com Git e o processo de Integração e Entrega Contínua (CI/CD).
</description>

<rule name="Estratégia de Branches (Git Flow Simplificado)">
  <description>Usamos um fluxo de trabalho baseado em feature branches.</description>
  <spec>**`main`:** A branch principal. Representa o código em produção. Só aceita merges de `develop` através de um processo de release.</spec>
  <spec>**`develop`:** A branch de integração. Todo o desenvolvimento novo é mergeado aqui. É a fonte da verdade para o próximo release.</spec>
  <spec>**`feat/{nome-da-feature}`:** Branches de feature. São criadas a partir de `develop`. Cada nova funcionalidade, bug fix ou melhoria é feita em uma feature branch.</spec>
  <spec>**`fix/{nome-do-bug}`:** Branches para correções de bugs.</spec>
  <spec>**`refactor/{escopo}`:** Branches para refatorações que não adicionam features nem corrigem bugs.</spec>
</rule>

<rule name="Conventional Commits">
  <description>As mensagens de commit devem seguir o padrão Conventional Commits. Isso nos permite gerar changelogs automaticamente e ter um histórico de commits legível e padronizado.</description>
  <spec>Formato: `<tipo>(<escopo>): <descrição>`</spec>
  <spec>**Tipos permitidos:**
    - `feat`: Uma nova funcionalidade.
    - `fix`: Uma correção de bug.
    - `docs`: Mudanças apenas na documentação.
    - `style`: Mudanças que não afetam o significado do código (formatação, etc.).
    - `refactor`: Uma mudança de código que não corrige um bug nem adiciona uma feature.
    - `perf`: Uma mudança de código que melhora a performance.
    - `test`: Adicionando ou corrigindo testes.
    - `chore`: Mudanças em build, dependências, etc.
  </spec>
  <example type="DO">
    ```
    feat(auth): adicionar login com Google
    fix(profile): corrigir bug que impedia o upload da foto
    docs(readme): atualizar instruções de setup
    refactor(api): mover lógica de fetch para um serviço separado
    ```
  </example>
</rule>

<rule name="Fluxo de Pull Request (PR)">
  <description>Todo o código deve passar por um Pull Request para ser mergeado em `develop`.</description>
  <spec>1. Crie a sua feature branch a partir de `develop` (`git checkout -b feat/minha-feature develop`).</spec>
  <spec>2. Faça seus commits seguindo o padrão Conventional Commits.</spec>
  <spec>3. Faça push da sua branch para o repositório remoto (`git push origin feat/minha-feature`).</spec>
  <spec>4. Abra um Pull Request no GitHub de `feat/minha-feature` para `develop`.</spec>
  <spec>5. O PR deve ter uma descrição clara do que foi feito.</spec>
  <spec>6. O PR deve passar por todas as checagens de CI (lint, testes, build).</spec>
  <spec>7. Após a aprovação e o CI passar, o PR pode ser mergeado usando "Squash and Merge" para manter o histórico da `develop` limpo.</spec>
</rule>

<rule name="Integração Contínua (CI)">
  <description>A pipeline de CI é acionada a cada push para uma feature branch e a cada merge em `develop`.</description>
  <spec>**Passos da Pipeline:**
    1. **Install:** Instala as dependências (`pnpm install`).
    2. **Lint:** Roda o linter para checar a qualidade do código (`pnpm lint`).
    3. **Test:** Roda todos os testes (unitários e de integração) (`pnpm test`).
    4. **Build:** Tenta buildar a aplicação para garantir que não há erros de compilação (`pnpm build`).
  </spec>
  <spec>Um PR só pode ser mergeado se todos os passos da pipeline passarem.</spec>
</rule>

</ruleset>
