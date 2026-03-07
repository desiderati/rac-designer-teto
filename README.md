# RAC Designer TETO - Project Guidelines

## 📋 Project Overview

**RAC Designer TETO** é um editor visual profissional para design de plantas de casas desenvolvido para a ONG TETO. A
aplicação permite que monitores, líderes de construção e voluntários criem plantas baixas e elevações de casas com
ferramentas avançadas de desenho 2D e visualização 3D interativa.

---

## 🎯 Project Goals & Priorities

### Primary Goals

1. **Accessibility & Usability** - Ferramentas devem ser intuitivas para usuários sem experiência técnica
2. **Precision & Accuracy** - Medições e desenhos devem ser precisos para uso profissional
3. **Performance** - Editor 2D e visualização 3D devem ser responsivos mesmo com plantas complexas
4. **Mobile-First Responsiveness** - Suportar tablets e dispositivos móveis para trabalho em campo

### What to Prioritize

- User experience e feedback visual claro
- Funcionalidades essenciais de desenho antes de features avançadas
- Documentação e tutorial interativo para novos usuários
- Compatibilidade com navegadores modernos (Chrome, Firefox, Safari, Edge)

### What to Avoid

- Adicionar muitas opções de configuração que confundem usuários
- Remover funcionalidades de desenho básicas
- Ignorar feedback de usuários sobre usabilidade

---

## 👥 User Personas

### Persona 1: Monitor Voluntário

- **Objetivo:** Criar plantas precisas de casas para projetos da TETO
- **Experiência:** Conhecimento técnico nos modelos de casa da TETO
- **Necessidades:** Ferramentas de desenho precisas, exportação para PDF, medições exatas
- **Frustração:** Interfaces complexas, demora na criação e alteração de RACs, falta de feedback visual

### Persona 2: Líder Voluntário

- **Objetivo:** Ver e validar plantas criadas por monitores
- **Experiência:** Conhecimento construtivo, experiência em métodos construtivos
- **Necessidades:** Visualização 3D clara, ferramentas de anotação, acesso a histórico de edições
- **Frustração:** Imprecisão da RAC; falta de entendimento do modelo criado pelos monitores

### Persona 3: Voluntário Iniciante

- **Objetivo:** Aprender a usar a ferramenta para entender como um processo construtivo funciona
- **Experiência:** Sem experiência em design
- **Necessidades:** Tutorial interativo, interface clara, mensagens de erro úteis
- **Frustração:** Falta de orientação, erros sem explicação

---

## 🤖 Automated Refactoring System

Definir como os agentes automáticos devem apoiar evolução do projeto sem causar regressões.
Para informações mais detalhadas veja em: `.agents/refactoring/README.md`

### Visão geral

O processo tem dois agentes:

1. Agente 1 (Análise)
    - Faz leitura do estado atual do projeto.
    - Propõe plano de melhoria.
    - Gera checklist de validação.

2. Agente 2 (Execução)
    - Executa o plano aprovado.
    - Valida cada etapa.
    - Interrompe e sinaliza quando encontrar erro crítico.

##3 Regras do Agente 1

1. Rodar em rotina definida.
2. Considerar apenas estado atual do projeto (sem suposição antiga).
3. Propor melhorias pequenas e executáveis.
4. Evitar repetir etapas já concluídas.
5. Produzir material claro para revisão humana.

##3 Regras do Agente 2

1. Só iniciar após aprovação humana do plano.
2. Executar por fases, com validação entre elas.
3. Tentar correção automática de falhas recuperáveis.
4. Parar em falhas críticas e registrar contexto.
5. Preservar segurança dos dados e possibilidade de recuperação.

### Regras de aprovação humana

1. Sempre revisar plano antes da execução.
2. Validar riscos de regressão e impacto no produto.
3. Confirmar se escopo proposto está adequado ao momento do projeto.

### Regras de validação mínima

Após execução das fases, deve haver validação de:

1. Testes automatizados definidos para a rodada.
2. Build do projeto.
3. Fluxos críticos de produto afetados pela mudança.

### Regras de rastreabilidade

1. Registrar plano, execução e resultado em documentação de rodada.
2. Manter histórico de sucesso/falha para aprendizado contínuo.
3. Em caso de rollback, registrar motivo e ponto de retorno.

### O que evitar

1. Execução sem aprovação.
2. Mudanças amplas sem checkpoints.
3. Encerrar rodada com falhas críticas não resolvidas sem registro explícito.

## 🛠️ Coding Conventions

### File Structure

```
.
├── .agents/                  # Documentação técnica para agentes
├── .agents/refactoring/      # Saídas do sistema de refatoração automática
├── .changelogs/              # Registro diário de mudanças
├── .lovable/                 # Planos/artefatos do Lovable (automação)
├── .prompts/                 # Guias de arquitetura, UX e workflow
├── .rules/                   # Regras funcionais por domínio/componente
├── e2e/                      # Testes E2E (Playwright)
├── public/                   # Assets estáticos
├── src/
│   ├── components/
│   │   ├── rac-editor/       # Núcleo do editor (ui, lib, hooks)
│   │   └── ui/               # Componentes base (shadcn/ui)
│   ├── domain/               # Domínio e casos de uso (ex.: house)
│   ├── infra/                # Infra/persistência/storage e settings
│   ├── pages/                # Páginas/rotas da aplicação
│   ├── shared/               # Configurações e tipos compartilhados
│   ├── test/                 # Setup de testes
│   ├── App.tsx               # Componente raiz
│   ├── index.css             # Estilos globais
│   └── main.tsx              # Bootstrap React/Vite
├── AGENTS.md                 # Instruções operacionais para agentes
├── package.json              # Scripts e dependências do projeto
└── README.md                 # Este documento
```

### Naming Conventions

#### Components

- PascalCase para nomes de componentes: `RacEditor`, `Canvas`, `Toolbar`
- Sufixo `Modal` para componentes de modal: `SettingsModal`, `ConfirmDialogModal`
- Sufixo `Editor` para componentes de edição: `PilotiEditor`, `DistanceEditor`

#### Functions & Variables

- camelCase para funções e variáveis: `handleCanvasClick`, `updateHouseData`
- Prefixo `handle` para event handlers: `handleMouseDown`, `handleKeyPress`
- Prefixo `on` para callbacks: `onSave`, `onCancel`
- Prefixo `is` ou `has` para booleanos: `isSelected`, `hasError`

#### Constants

- UPPER_SNAKE_CASE para constantes globais: `MAX_ZOOM_LEVEL`, `DEFAULT_CANVAS_SIZE`
- camelCase para constantes de módulo: `defaultSettings`, `toolbarHeight`

### TypeScript Best Practices

- Sempre definir tipos explícitos para props e retorno de funções
- Usar interfaces para definir estruturas de dados
- Evitar `any` - usar `unknown` se necessário e fazer type narrowing
- Usar tipos genéricos para componentes reutilizáveis

```typescript
// ✅ Bom
interface CanvasProps {
    width: number;
    height: number;
    onDraw: (data: DrawData) => void;
}

const Canvas: React.FC<CanvasProps> = ({width, height, onDraw}) => {
    // ...
};

// ❌ Evitar
const Canvas = (props: any) => {
    // ...
};
```

### React Best Practices

- Usar functional components com hooks
- Memorizar componentes pesados com `React.memo` quando apropriado
- Usar `useCallback` para event handlers que são passados como props
- Evitar criar objetos/arrays dentro de render - usar `useMemo` se necessário
- Sempre adicionar key props em listas

```tsx
// ✅ Bom
const HouseList: React.FC<{ houses: House[] }> = ({houses}) => (
    <div>
        {houses.map(house => (<HouseCard key={house.id} house={house}/>))}
    </div>
);

// ❌ Evitar
const HouseList: React.FC<{ houses: House[] }> = ({houses}) => (
    <div>
        {houses.map((house, index) => (<HouseCard key={index} house={house}/>))}
    </div>
);
```

### CSS & Tailwind

- Usar Tailwind CSS para styling - evitar CSS-in-JS quando possível
- Manter classes Tailwind organizadas: layout → spacing → sizing → colors → effects
- Usar `clsx` para classes condicionais
- Extrair componentes reutilizáveis ao invés de duplicar classes

```typescript
// ✅ Bom
const buttonClasses = clsx(
    'px-4 py-2 rounded-lg font-medium',
    'transition-colors duration-200',
    isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
);

// ❌ Evitar
const buttonClasses = `${isActive ? 'bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200' : 'bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200'}`;
```

### Comments & Documentation

- Comentar lógica complexa, não código óbvio
- Usar JSDoc para funções e componentes públicos
- Manter comentários atualizados quando código muda

```typescript
/**
 * Calcula a área de um polígono usando a fórmula de Shoelace
 * @param points - Array de pontos [x, y] que formam o polígono
 * @returns Área do polígono em unidades quadradas
 */
function calculatePolygonArea(points: [number, number][]): number {
    // Implementação...
}
```

---

## 🎯 Feature-Specific Guidelines

### Canvas Editor (2D)

- Usar Fabric.js para manipulação de objetos
- Suportar undo/redo para todas as operações
- Fornecer feedback visual claro para seleção de objetos
- Implementar snap-to-grid para alinhamento preciso
- Suportar múltiplas seleções com Ctrl/Cmd+Click

### 3D Viewer

- Usar React Three Fiber para renderização 3D
- Implementar rotação, zoom e pan intuitivos
- Suportar múltiplas ângulos (superior, frontal, lateral)
- Otimizar performance para plantas complexas

### Modals & Dialogs

- Usar confirmação antes de persistir estado do canvas
- Manter modais simples e focados em uma tarefa
- Suportar fechar com ESC

### Toolbar

- Agrupar ferramentas relacionadas
- Mostrar tooltip ao passar mouse
- Indicar ferramenta ativa visualmente
- Desabilitar ferramentas não aplicáveis ao contexto

---

## 🔄 Development Workflow

### Before Starting Work

1. Ler este guideline completamente
2. Entender a persona do usuário afetada
3. Verificar se há componentes reutilizáveis existentes

### During Development

1. Seguir as convenções de código definidas
2. Testar em múltiplos navegadores
3. Verificar responsividade em mobile
4. Adicionar tipos TypeScript completos

### Comandos principais (estado atual)

1. Instalação de dependências:

    ```bash
    npm install
    ```

2. Desenvolvimento local (recomendado para esta pasta):

    ```bash
    npm run dev -- --host 0.0.0.0
    ```

3. Build de produção:

    ```bash
    npm run build
    ```

4. Testes unitários/smoke:

    ```bash
    npm run test
    npx vitest run smoke.test
    ```

5. Lint:

    ```bash
    npm run lint
    ```

6. Testes E2E:

    ```bash
    npm run test:e2e
    ```

7. Regressão completa:

    ```bash
    npm run test:regression
    ```

### Before Committing

1. Executar `npm run lint` e corrigir erros
2. Testar funcionalidade completa
3. Verificar se não quebrou features existentes
4. Escrever mensagem de commit clara

### Commit Message Format

```
<type>(<scope>): <subject>

<body>
```

- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Scopes: `canvas`, `3d-viewer`, `toolbar`, `modals`, `ui`, `core`

Exemplo:

```
feat(canvas): add polygon drawing tool

- Implement polygon drawing with click-to-add-points
- Add double-click to finish polygon
- Include snap-to-grid functionality
```

---

## 🚀 Performance Guidelines

### Canvas Performance

- Renderizar apenas objetos visíveis
- Usar debounce para eventos de mouse
- Limitar taxa de atualização para 60fps
- Otimizar Fabric.js com `renderOnAddRemove: false`

### 3D Performance

- Usar LOD (Level of Detail) para modelos complexos
- Limpar geometrias não utilizadas
- Usar instancing para objetos repetidos
- Monitorar FPS e avisar se < 30fps

### Memory Management

- Limpar listeners de eventos ao desmontar componentes
- Usar `useCallback` para evitar recriação de funções
- Implementar lazy loading para dados grandes
- Limpar canvas antes de descarregar

---

## 🔒 Security & Data Protection

### User Data

- Não armazenar dados sensíveis em localStorage sem encriptação
- Validar entrada de usuário no frontend e backend
- Sanitizar dados antes de renderizar

### File Handling

- Validar tipo de arquivo antes de processar
- Limitar tamanho máximo de arquivo
- Usar Web Workers para processamento pesado
- Implementar timeout para operações longas

---

## 📱 Accessibility & Inclusivity

### WCAG 2.1 Compliance

- Manter contraste de cores ≥ 4.5:1 para texto
- Suportar navegação por teclado (Tab, Enter, ESC)
- Adicionar ARIA labels para elementos interativos
- Testar com screen readers (NVDA, JAWS)

### Mobile Considerations

- Touch targets mínimo de 44x44px
- Suportar orientação portrait e landscape
- Testar em dispositivos reais, não apenas emuladores
- Considerar conexões lentas (3G)

---

## 🐛 Debugging & Troubleshooting

### Common Issues

**Canvas não renderiza:**

- Verificar se Fabric.js foi inicializado
- Verificar console para erros de JavaScript
- Validar dimensões do canvas

**3D Viewer lento:**

- Verificar quantidade de objetos renderizados
- Usar DevTools > Performance para profile
- Reduzir qualidade de texturas se necessário

**Undo/Redo não funciona:**

- Verificar se ação foi adicionada ao histórico
- Validar serialização de objetos
- Testar com diferentes tipos de objetos

### Debug Mode

- Adicionar `?debug=true` à URL para modo debug
- Mostrar grid, coordenadas e informações de performance
- Logar todas as ações para auditoria

---

## 📚 External References

- **Fabric.js Docs:** http://fabricjs.com/
- **React Three Fiber:** https://docs.pmnd.rs/react-three-fiber/
- **Tailwind CSS:** https://tailwindcss.com/
- **shadcn/ui:** https://ui.shadcn.com/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **TETO ONG:** https://www.teto.org.br/

---

## 🔄 Version History

- **v1.1.0** (2026-03-04) - Atualização incremental de compatibilidade com o código atual
    - Estrutura de diretórios revisada
    - Comandos de execução/teste sincronizados com `package.json`
    - Ajustes de nomenclatura e referências

- **v1.0.0** (2026-02-17) - Initial guideline creation
    - Definição de personas
    - Convenções de código
    - Design system
    - Performance guidelines

---

**Last Updated:** 2026-03-04  
**Maintained By:** Felipe Desiderati  
**Automated By:** Agent 1 (Analysis) & Agent 2 (Execution)  
**Questions?** Consulte a documentação do projeto ou abra uma issue no GitHub

---

## 📚 Additional Resources

- **Refactoring Agents:** `.agents/refactoring/README.md`
- **Regras funcionais por módulo:** `.rules/README.md`
