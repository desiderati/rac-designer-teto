---
title: Padrões de Componentes Frontend
id: PLAY-101
doc_type: playbook
doc_set: engineering-playbook
family: frontend
precedence: 101
status: active
lang: pt-BR
---

# Padrões de Componentes Frontend

## Objetivo

Definir regras para criação de componentes React previsíveis, reutilizáveis e fáceis de manter.

## Composição sobre herança

Sempre prefira composição para reutilizar lógica e UI. Use props como `children` ou props
específicas para injetar outros componentes, em vez de criar hierarquias complexas.

Exemplo recomendado:

```tsx
function Card({header, children}: CardProps) {
  return (
    <div>
      <header>{header}</header>
      <main>{children}</main>
    </div>
  );
}

<Card header={<h2>Title</h2>}>
  <p>Content</p>
</Card>;
```

## Separação entre lógica e apresentação

- Componentes presentacionais recebem dados e callbacks via props.

- Componentes de coordenação gerenciam estado, integração e composição.

- A divisão não precisa virar dogma cerimonial, mas a responsabilidade de cada componente deve
  continuar legível.

Exemplo recomendado, usando vocabulário do editor:

```tsx
type Viewer3DTriggerProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

function Viewer3DTrigger({ isOpen, onOpenChange }: Viewer3DTriggerProps) {
  return (
    <button type="button" aria-pressed={isOpen} onClick={() => onOpenChange(!isOpen)}>
      Alternar visualização 3D
    </button>
  );
}

function RacEditorViewerControls() {
  const { is3DViewerOpen, setIs3DViewerOpen } = useRacEditorModalState();

  return (
    <Viewer3DTrigger
      isOpen={is3DViewerOpen}
      onOpenChange={setIs3DViewerOpen}
    />
  );
}
```

Ao extrair esse padrão do `RacEditor`, mantenha a coordenação no ponto que já detém o estado. Não
crie container paralelo nem hooks remotos fictícios para simular arquitetura de data fetching que
não existe no fluxo local do editor.

## Props com destructuring e tipos explícitos

- Sempre desestruture props na assinatura da função.
- Use um tipo ou interface explícita com sufixo `Props`.

Exemplo recomendado:

```tsx
type ButtonProps = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
};

function Button({ label, onClick, variant = "primary" }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

Exemplo a evitar:

```tsx
function Button(props) {
  return <button>{props.label}</button>;
}
```

## Renderização condicional limpa

- Use ternário para condições simples.
- Use `&&` para renderização opcional simples.
- Quando a lógica ficar densa, extraia para variável ou função auxiliar.

Exemplo recomendado:

```tsx
<div>
  {is3DViewerOpen ? <House3DViewer/> : <CanvasArea/>}
  {showZoomControls && <ZoomControls/>}
</div>
```

Exemplo a evitar:

```tsx
<div>{isLoading ? <Spinner/> : error ? <Error/> : data ? <Data/> : null}</div>
```

## Keys em listas

- Use uma `key` estável e única.
- Não use índice do array quando a lista puder ser reordenada, adicionada ou removida.

## Props drilling excessivo

Se uma prop atravessa mais de dois ou três níveis sem uso intermediário, reavalie a modelagem. O
caminho preferencial é usar contexto ou a coordenação compartilhada já existente na feature antes de
criar uma solução paralela desnecessária.
