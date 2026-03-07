# SECURITY AND ACCESSIBILITY (A11Y)

<ruleset name="Security and Accessibility">

<description>
Regras para garantir que a aplicação seja segura e acessível a todos os usuários, incluindo aqueles com deficiências.
</description>

<rule name="Prevenção de Cross-Site Scripting (XSS)">
  <description>Nunca insira HTML diretamente no DOM a partir de uma fonte não confiável. React já faz o escape de conteúdo renderizado no JSX por padrão, mas o uso de `dangerouslySetInnerHTML` é estritamente proibido, a menos que o conteúdo seja sanitizado por uma biblioteca confiável como `DOMPurify`.</description>
  <example type="DO_NOT">
    ```tsx
    // PROIBIDO: Abre uma falha de XSS
    <div dangerouslySetInnerHTML={{ __html: userProvidedContent }} />
    ```
  </example>
  <example type="DO">
    ```tsx
    import DOMPurify from 'dompurify';

    const sanitizedContent = DOMPurify.sanitize(userProvidedContent);
    <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
    ```
  </example>
</rule>

<rule name="Validação de Input do Lado do Cliente e do Servidor">
  <description>Toda entrada de usuário deve ser validada. Use Zod para criar schemas de validação que podem ser compartilhados entre o cliente e o servidor. A validação do lado do cliente melhora a UX, mas a validação do lado do servidor é a única que garante a segurança.</description>
</rule>

<rule name="Uso de Atributos `rel` em Links Externos">
  <description>Sempre adicione `rel="noopener noreferrer"` a qualquer link que abra em uma nova aba (`target="_blank"`) para prevenir ataques de tabnabbing.</description>
  <example type="DO">
    ```tsx
    <a href="https://externalsite.com" target="_blank" rel="noopener noreferrer">
      External Site
    </a>
    ```
  </example>
</rule>

<rule name="HTML Semântico">
  <description>Use elementos HTML pelo seu significado, não pela sua aparência. Use `<button>` para ações, `<a>` para navegação, `<nav>` para menus, `<main>` para o conteúdo principal, etc. Isso é a base da acessibilidade.</description>
  <example type="DO">
    ```tsx
    <button onClick={handleSave}>Salvar</button>
    ```
  </example>
  <example type="DO_NOT">
    ```tsx
    <div onClick={handleSave} className="button-style">Salvar</div>
    ```
  </example>
</rule>

<rule name="Atributos ARIA">
  <description>Use atributos ARIA (Accessible Rich Internet Applications) para adicionar semântica a componentes complexos que não podem ser representados por HTML nativo. Bibliotecas de componentes como Shadcn/ui já fazem isso. Ao criar componentes customizados, certifique-se de que eles são acessíveis.</description>
  <spec>Use `aria-label` para dar um nome acessível a um elemento que não tem texto visível.</spec>
  <spec>Use `aria-live` para anunciar mudanças dinâmicas de conteúdo.</spec>
  <spec>Use `role` para definir o propósito de um elemento (ex: `role="alert"`).</spec>
</rule>

<rule name="Acessibilidade de Formulários">
  <description>Todo campo de formulário (`<input>`, `<select>`, `<textarea>`) deve ter um `<label>` associado a ele usando o atributo `htmlFor`.</description>
  <example type="DO">
    ```tsx
    <label htmlFor="email">Email</label>
    <input type="email" id="email" />
    ```
  </example>
</rule>

<rule name="Navegação por Teclado">
  <description>Todos os elementos interativos (links, botões, campos de formulário) devem ser focáveis e operáveis usando apenas o teclado. A ordem do foco deve ser lógica e seguir a ordem visual da página.</description>
</rule>

<rule name="Contraste de Cores">
  <description>O texto deve ter um contraste de cor suficiente em relação ao seu fundo para ser legível. Use ferramentas de verificação de contraste para garantir que a taxa de contraste atenda aos padrões do WCAG (Web Content Accessibility Guidelines) - no mínimo 4.5:1 para texto normal.</description>
</rule>

</ruleset>
