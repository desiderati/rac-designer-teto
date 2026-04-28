---
title: Segurança e Acessibilidade no Frontend
id: PLAY-105
doc_type: playbook
doc_set: engineering-playbook
family: frontend
precedence: 105
status: active
lang: pt-BR
---

# Segurança e Acessibilidade no Frontend

## Objetivo

Definir regras para manter a aplicação segura e acessível para todos os usuários, inclusive quem depende de
tecnologias assistivas.

## Prevenção de XSS

- Nunca injete HTML não confiável diretamente no DOM.
- React já escapa conteúdo renderizado no JSX por padrão.
- `dangerouslySetInnerHTML` não é padrão aceito para código novo.
- Exceções atuais existem apenas em pontos estreitos: mensagens internas do editor e CSS gerado pelo primitive de chart.
- Não replique essas exceções para conteúdo de usuário, resposta remota, JSON importado ou texto editável.
- Se HTML arbitrário for inevitável, escolha explicitamente uma das duas rotas: renderização estruturada em React ou
  sanitização com biblioteca confiável adicionada ao projeto.

Exemplo a evitar:

```tsx
<div dangerouslySetInnerHTML={{ __html: userProvidedContent }} />
```

Exemplo preferencial, sem HTML bruto:

```tsx
type InfoMessageProps = {
  children: React.ReactNode;
};

function InfoMessage({ children }: InfoMessageProps) {
  return <div role="status">{children}</div>;
}

<InfoMessage>
  <strong>Dica:</strong> Modo Lápis ativado.
</InfoMessage>;
```

Exemplo aceitável apenas quando a dependência de sanitização existir e a origem do HTML justificar esse custo:

```tsx
const sanitizedContent = sanitizeTrustedHtml(userProvidedContent);
<div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
```

## Validação de input

- Toda entrada de usuário deve ser validada.
- Validação do lado do cliente melhora UX.
- Validação do lado do servidor é a única que garante segurança de fato.
- Quando fizer sentido, use Zod para compartilhar contratos entre camadas. Hoje Zod está instalado, mas não é usado
  ativamente em `src`; introduza-o apenas junto com um contrato real de entrada.

## Links externos

Sempre adicione `rel="noopener noreferrer"` a links com `target="_blank"` para prevenir tabnabbing.

## HTML semântico

- Use elementos HTML pelo significado, não pela aparência.
- Use `button` para ação, `a` para navegação, `nav` para menus, `main` para conteúdo principal.

Exemplo recomendado:

```tsx
<button onClick={handleSave}>Salvar</button>
```

Exemplo a evitar:

```tsx
<div onClick={handleSave} className="button-style">
    Salvar
</div>
```

## Atributos ARIA

- Use atributos ARIA para adicionar semântica quando HTML nativo não for suficiente.
- Bibliotecas como shadcn/ui já ajudam nisso, mas componentes customizados continuam sendo responsabilidade do time.
- Use `aria-label` para nome acessível sem texto visível.
- Use `aria-live` para anunciar mudanças dinâmicas.
- Use `role` quando necessário para deixar o propósito do elemento explícito.

## Acessibilidade de formulários

Todo campo de formulário deve ter `label` associado via `htmlFor`.

## Navegação por teclado

Todos os elementos interativos devem ser focáveis e operáveis apenas com teclado. A ordem do foco deve seguir a ordem
visual e lógica da interface.

## Contraste de cores

Garanta contraste suficiente entre texto e fundo. Use ferramentas de contraste e respeite, no mínimo, a razão 4.5:1
para texto normal segundo WCAG.
