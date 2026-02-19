# Plano de Refatoração: RAC Designer TETO

## Arquitetura OO com Clean Code e SOLID

**Data:** Fevereiro 2026  
**Objetivo:** Refatorar o código para melhor coesão, legibilidade e testabilidade seguindo princípios SOLID e Clean
Code.

---

## 📊 Análise Atual

### Problemas Identificados

#### 1. **Componentes Monolíticos**

- **RACEditor.tsx** 
- **Canvas.tsx**
- **canvas-utils.ts**: (funções utilitárias sem estrutura)
- **house-manager.ts**: (gerenciamento de estado)

**Impacto:** Difícil de testar, manter e evoluir. Responsabilidades misturadas.

#### 2. **Violações SOLID**

| Princípio                     | Problema                                    | Exemplo                                                             |
|-------------------------------|---------------------------------------------|---------------------------------------------------------------------|
| **S** (Single Responsibility) | Componentes com múltiplas responsabilidades | RACEditor gerencia: UI, lógica de canvas, modais, tutorial, estado  |
| **O** (Open/Closed)           | Difícil estender sem modificar              | Adicionar novo tipo de editor requer mudanças em múltiplos arquivos |
| **L** (Liskov Substitution)   | Sem interfaces bem definidas                | Editors (Piloti, Distance, etc) não compartilham contrato           |
| **I** (Interface Segregation) | Interfaces grandes                          | Canvas props com 10+ callbacks                                      |
| **D** (Dependency Inversion)  | Dependências diretas                        | Componentes dependem de implementações concretas                    |

#### 3. **Problemas de Arquitetura**

- **State Management Caótico**: 20+ useState em RACEditor
- **Lógica de Negócio Espalhada**: Canvas-utils mistura criação, transformação e serialização
- **Sem Camadas Claras**: UI, lógica e dados não separados
- **Testes Impossíveis**: Componentes acoplados ao Fabric.js e DOM

#### 4. **Código Duplicado**

- Lógica de piloti repetida em múltiplos editores
- Padrões de seleção duplicados
- Transformações de objetos Fabric repetidas

---

## 🏗️ Arquitetura Proposta

### Estrutura de Camadas

```
src/
├── domain/                   # Lógica de negócio pura (sem dependências externas)
│   ├── entities/             # Entidades de domínio
│   ├── value-objects/        # Objetos de valor
│   ├── services/             # Serviços de domínio
│   └── repositories/         # Interfaces de repositório
│
├── application/             # Casos de uso e orquestração
│   ├── use-cases/           # Casos de uso específicos
│   ├── dto/                 # Data Transfer Objects
│   └── services/            # Serviços de aplicação
│
├── infrastructure/          # Implementações técnicas
│   ├── fabric/              # Adaptadores Fabric.js
│   ├── storage/             # Persistência (localStorage, etc)
│   └── repositories/        # Implementações de repositório
│
├── presentation/            # Componentes React
│   ├── pages/               # Páginas
│   ├── containers/          # Containers (conectam com aplicação)
│   ├── components/          # Componentes puros
│   └── hooks/               # Custom hooks
│
└── shared/                  # Código compartilhado
    ├── types/               # Tipos globais
    ├── constants/           # Constantes
    └── utils/               # Utilitários puros
```

### Padrões de Design

1. **Repository Pattern**: Abstração de dados
2. **Service Layer**: Lógica de negócio
3. **Dependency Injection**: Desacoplamento
4. **Observer Pattern**: Gerenciamento de estado
5. **Strategy Pattern**: Diferentes tipos de editores
6. **Factory Pattern**: Criação de objetos Fabric
7. **Command Pattern**: Undo/Redo

---

## 📋 Plano de Refatoração Detalhado

### Fase 1: Fundação (Semana 1-2)

#### 1.1 Criar Estrutura de Domínio

**Objetivo:** Extrair lógica de negócio pura

**Arquivos a criar:**

```typescript
// src/domain/entities/House.ts
export class House {
    private id: string;
    private type: HouseType;
    private pilotis: Map<string, Piloti>;
    private views: Map<ViewType, HouseView[]>;

    constructor(id: string, type: HouseType) {
        this.id = id;
        this.type = type;
        this.pilotis = new Map();
        this.views = new Map();
    }

    addPiloti(id: string, piloti: Piloti): void {
        if (this.pilotis.has(id)) {
            throw new Error(`Piloti ${id} already exists`);
        }
        this.pilotis.set(id, piloti);
    }

    getPiloti(id: string): Piloti {
        const piloti = this.pilotis.get(id);
        if (!piloti) {
            throw new Error(`Piloti ${id} not found`);
        }
        return piloti;
    }

    updatePilotiHeight(id: string, height: number): void {
        const piloti = this.getPiloti(id);
        piloti.setHeight(height);
    }

    // ... outros métodos
}

// src/domain/value-objects/Piloti.ts
export class Piloti {
    private readonly id: string;
    private height: number;
    private isMaster: boolean;
    private nivel: number;

    constructor(id: string, height: number = 1.0, isMaster: boolean = false, nivel: number = 0) {
        this.id = id;
        this.height = this.validateHeight(height);
        this.isMaster = isMaster;
        this.nivel = nivel;
    }

    private validateHeight(height: number): number {
        const valid = [1.0, 1.2, 1.5, 2.0, 2.5, 3.0];
        if (!valid.includes(height)) {
            throw new Error(`Invalid piloti height: ${height}`);
        }
        return height;
    }

    setHeight(height: number): void {
        this.height = this.validateHeight(height);
    }

    setMaster(isMaster: boolean): void {
        this.isMaster = isMaster;
    }

    setNivel(nivel: number): void {
        this.nivel = Math.max(0, nivel);
    }

    // Getters
    getId(): string {
        return this.id;
    }

    getHeight(): number {
        return this.height;
    }

    isMasterPiloti(): boolean {
        return this.isMaster;
    }

    getNivel(): number {
        return this.nivel;
    }
}

// src/domain/value-objects/HouseView.ts
export class HouseView {
    private readonly type: ViewType;
    private readonly side?: HouseSide;
    private readonly instanceId: string;

    constructor(type: ViewType, side?: HouseSide) {
        this.type = type;
        this.side = side;
        this.instanceId = generateId();
    }

    getType(): ViewType {
        return this.type;
    }

    getSide(): HouseSide | undefined {
        return this.side;
    }

    getInstanceId(): string {
        return this.instanceId;
    }
}
```

**Benefícios:**

- Lógica de negócio testável sem Fabric.js
- Validações centralizadas
- Fácil de reutilizar

**Tarefas:**

- [ ] Criar classe `House`
- [ ] Criar classe `Piloti`
- [ ] Criar classe `HouseView`
- [ ] Criar classe `HouseElement`
- [ ] Criar classe `Canvas` (domínio)
- [ ] Criar exceções customizadas
- [ ] Criar testes unitários para entidades

---

#### 1.2 Criar Camada de Repositório

**Objetivo:** Abstrair acesso a dados

```typescript
// src/domain/repositories/HouseRepository.ts
export interface IHouseRepository {
    save(house: House): Promise<void>;

    load(id: string): Promise<House>;

    delete(id: string): Promise<void>;

    list(): Promise<House[]>;
}

// src/infrastructure/repositories/LocalStorageHouseRepository.ts
export class LocalStorageHouseRepository implements IHouseRepository {
    async save(house: House): Promise<void> {
        const data = this.serialize(house);
        localStorage.setItem(`house_${house.getId()}`, JSON.stringify(data));
    }

    async load(id: string): Promise<House> {
        const data = localStorage.getItem(`house_${id}`);
        if (!data) {
            throw new Error(`House ${id} not found`);
        }
        return this.deserialize(JSON.parse(data));
    }

    // ... implementação
}
```

**Tarefas:**

- [ ] Criar interface `IHouseRepository`
- [ ] Criar `LocalStorageHouseRepository`
- [ ] Criar `InMemoryHouseRepository` (para testes)
- [ ] Migrar lógica de localStorage

---

#### 1.3 Criar Serviços de Aplicação

**Objetivo:** Orquestrar casos de uso

```typescript
// src/application/services/HouseApplicationService.ts
export class HouseApplicationService {
    constructor(
        private houseRepository: IHouseRepository,
        private canvasService: ICanvasService
    ) {
    }

    async createHouse(type: HouseType): Promise<House> {
        const house = new House(generateId(), type);
        await this.houseRepository.save(house);
        return house;
    }

    async updatePilotiHeight(houseId: string, pilotiId: string, height: number): Promise<void> {
        const house = await this.houseRepository.load(houseId);
        house.updatePilotiHeight(pilotiId, height);
        await this.houseRepository.save(house);

        // Atualizar visualização
        await this.canvasService.updatePilotiVisual(pilotiId, height);
    }

    // ... outros casos de uso
}

// src/application/use-cases/CreateHouseUseCase.ts
export class CreateHouseUseCase {
    constructor(private houseRepository: IHouseRepository) {
    }

    async execute(input: CreateHouseInput): Promise<CreateHouseOutput> {
        const house = new House(generateId(), input.type);
        await this.houseRepository.save(house);

        return {
            id: house.getId(),
            type: house.getType(),
        };
    }
}
```

**Tarefas:**

- [ ] Criar `HouseApplicationService`
- [ ] Criar use cases específicos
- [ ] Criar DTOs para entrada/saída
- [ ] Criar testes de integração

---

### Fase 2: Separação de Responsabilidades (Semana 3-4)

#### 2.1 Refatorar Canvas.tsx

**Problema Atual:**

- Mistura: gerenciamento de canvas, seleção, história, zoom

**Solução:**

```typescript
// src/presentation/hooks/useCanvasState.ts
export function useCanvasState() {
    const [zoom, setZoom] = useState(1);
    const [viewportX, setViewportX] = useState(0);
    const [viewportY, setViewportY] = useState(0);
    const [selectedObjects, setSelectedObjects] = useState<FabricObject[]>([]);

    return {
        zoom,
        setZoom,
        viewportX,
        setViewportX,
        viewportY,
        setViewportY,
        selectedObjects,
        setSelectedObjects,
    };
}

// src/presentation/hooks/useCanvasHistory.ts
export function useCanvasHistory(canvas: FabricCanvas | null) {
    const historyRef = useRef<string[]>([]);

    const saveHistory = useCallback(() => {
        if (!canvas) return;
        historyRef.current.push(JSON.stringify(canvas.toJSON()));
    }, [canvas]);

    const undo = useCallback(() => {
        if (!canvas || historyRef.current.length === 0) return;
        const previousState = historyRef.current.pop();
        if (previousState) {
            canvas.loadFromJSON(previousState, () => canvas.renderAll());
        }
    }, [canvas]);

    return {saveHistory, undo};
}

// src/presentation/components/Canvas/Canvas.tsx (Refatorado)
export const Canvas = forwardRef<CanvasHandle, CanvasProps>(
    ({onSelectionChange, onHistorySave, ...props}, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const fabricCanvasRef = useRef<FabricCanvas | null>(null);

        const canvasState = useCanvasState();
        const canvasHistory = useCanvasHistory(fabricCanvasRef.current);

        // Inicializar canvas
        useEffect(() => {
            if (!canvasRef.current) return;

            const canvas = new FabricCanvas(canvasRef.current, {
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
            });

            fabricCanvasRef.current = canvas;
            setupCanvasEventHandlers(canvas, canvasState, onSelectionChange);
        }, []);

        useImperativeHandle(ref, () => ({
            canvas: fabricCanvasRef.current,
            saveHistory: canvasHistory.saveHistory,
            // ...
        }));

        return (
            <div ref={containerRef} className="canvas-container">
                <canvas ref={canvasRef}/>
            </div>
        );
    }
);
```

**Tarefas:**

- [ ] Extrair `useCanvasState`
- [ ] Extrair `useCanvasHistory`
- [ ] Extrair `useCanvasSelection`
- [ ] Extrair `useCanvasZoom`
- [ ] Refatorar Canvas.tsx para usar hooks
- [ ] Reduzir de 1.366 para ~400 linhas

---

#### 2.2 Refatorar RACEditor.tsx

**Problema Atual:**

- 1.697 linhas
- 39 hooks
- Gerencia: UI, modais, tutorial, canvas, estado

**Solução:**

```typescript
// src/presentation/containers/RACEditorContainer.tsx
export function RACEditorContainer() {
    const [house, setHouse] = useState<House | null>(null);
    const houseService = useHouseApplicationService();

    useEffect(() => {
        houseService.createHouse('tipo6').then(setHouse);
    }, []);

    if (!house) return <LoadingSpinner/>;

    return (
        <RACEditorPresentation house={house}
            onPilotiUpdate={(pilotiId, height) => houseService.updatePilotiHeight(house.getId(), pilotiId, height)} 
        />
    );
}

// src/presentation/pages/RACEditor.tsx (Apresentação pura)
export function RACEditorPresentation({house, onPilotiUpdate}: Props) {
    const [activeSubmenu, setActiveSubmenu] = useState<MenuType | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const canvasRef = useRef<CanvasHandle>(null);

    return (
        <div className="rac-editor">
            <Toolbar onMenuChange={setActiveSubmenu} onSettingsClick={() => setShowSettings(true)}/>
            <Canvas ref={canvasRef}/>
            {
                showSettings && (<SettingsModal onClose={() => setShowSettings(false)}/>)
            }
            {
                /* Outros modais */
            }
        </div>
    );
}
```

**Tarefas:**

- [ ] Criar `RACEditorContainer` (lógica)
- [ ] Criar `RACEditorPresentation` (UI)
- [ ] Extrair gerenciamento de modais
- [ ] Extrair lógica de tutorial
- [ ] Reduzir de 1.697 para ~300 linhas de apresentação

---

#### 2.3 Refatorar canvas-utils.ts

**Problema Atual:**

- 1.821 linhas
- Mistura: criação, transformação, serialização
- Sem estrutura OO

**Solução:**

```typescript
// src/infrastructure/fabric/FabricObjectFactory.ts
export class FabricObjectFactory {
    static createHouseTop(width: number, height: number): Group {
        // Implementação
    }

    static createPiloti(id: string, height: number, isMaster: boolean): Group {
        // Implementação
    }

    static createDoor(width: number, height: number): Rect {
        // Implementação
    }

    // ... outros factory methods
}

// src/infrastructure/fabric/FabricObjectTransformer.ts
export class FabricObjectTransformer {
    static updatePilotiHeight(piloti: Group, height: number): void {
        // Implementação
    }

    static updatePilotiMaster(piloti: Group, isMaster: boolean): void {
        // Implementação
    }

    // ... outras transformações
}

// src/infrastructure/fabric/CanvasSerializer.ts
export class CanvasSerializer {
    static serialize(canvas: FabricCanvas): CanvasData {
        // Implementação
    }

    static deserialize(data: CanvasData, canvas: FabricCanvas): Promise<void> {
        // Implementação
    }
}
```

**Tarefas:**

- [ ] Criar `FabricObjectFactory`
- [ ] Criar `FabricObjectTransformer`
- [ ] Criar `CanvasSerializer`
- [ ] Dividir em 4 arquivos menores
- [ ] Adicionar testes unitários

---

### Fase 3: Padrões de Design (Semana 5-6)

#### 3.1 Implementar Strategy Pattern para Editores

**Problema Atual:**

- Múltiplos editores (Piloti, Distance, LineArrow) sem interface comum
- Código duplicado

**Solução:**

```typescript
// src/domain/services/EditorStrategy.ts
export interface IEditorStrategy {
    canEdit(object: FabricObject): boolean;

    getEditData(object: FabricObject): EditData;

    applyEdit(object: FabricObject, data: EditData): void;

    getScreenPosition(object: FabricObject): { x: number; y: number };
}

// src/application/editors/PilotiEditorStrategy.ts
export class PilotiEditorStrategy implements IEditorStrategy {
    canEdit(object: FabricObject): boolean {
        return object.get('isPilotiCircle') === true;
    }

    getEditData(object: FabricObject): PilotiEditData {
        return {
            pilotiId: object.get('pilotiId'),
            currentHeight: object.get('pilotiHeight'),
            currentIsMaster: object.get('pilotiIsMaster'),
        };
    }

    applyEdit(object: FabricObject, data: PilotiEditData): void {
        object.set({
            pilotiHeight: data.currentHeight,
            pilotiIsMaster: data.currentIsMaster,
        });
    }

    getScreenPosition(object: FabricObject): { x: number; y: number } {
        return {x: object.left || 0, y: object.top || 0};
    }
}

// src/presentation/hooks/useEditorStrategy.ts
export function useEditorStrategy(object: FabricObject | null) {
    const strategies: IEditorStrategy[] = [
        new PilotiEditorStrategy(),
        new DistanceEditorStrategy(),
        new LineArrowEditorStrategy(),
    ];

    const strategy = object ? strategies.find(s => s.canEdit(object)) : null;

    return strategy;
}
```

**Tarefas:**

- [ ] Criar interface `IEditorStrategy`
- [ ] Criar `PilotiEditorStrategy`
- [ ] Criar `DistanceEditorStrategy`
- [ ] Criar `LineArrowEditorStrategy`
- [ ] Refatorar editores para usar strategy
- [ ] Remover código duplicado

---

#### 3.2 Implementar Observer Pattern para Estado

**Problema Atual:**

- 20+ useState em RACEditor
- Difícil sincronizar estado

**Solução:**

```typescript
// src/application/state/EditorStateManager.ts
export class EditorStateManager {
    private observers: Set<(state: EditorState) => void> = new Set();
    private state: EditorState = {
        activeSubmenu: null,
        showSettings: false,
        selectedObject: null,
        // ...
    };

    subscribe(observer: (state: EditorState) => void): () => void {
        this.observers.add(observer);
        return () => this.observers.delete(observer);
    }

    setState(updates: Partial<EditorState>): void {
        this.state = {...this.state, ...updates};
        this.notifyObservers();
    }

    private notifyObservers(): void {
        this.observers.forEach(observer => observer(this.state));
    }

    getState(): EditorState {
        return this.state;
    }
}

// src/presentation/hooks/useEditorState.ts
export function useEditorState(stateManager: EditorStateManager) {
    const [state, setState] = useState(stateManager.getState());

    useEffect(() => {
        return stateManager.subscribe(setState);
    }, [stateManager]);

    return state;
}
```

**Tarefas:**

- [ ] Criar `EditorStateManager`
- [ ] Criar `useEditorState` hook
- [ ] Migrar estado de RACEditor
- [ ] Remover useState desnecessários
- [ ] Adicionar testes

---

### Fase 4: Testes e Documentação (Semana 7-8)

#### 4.1 Testes Unitários

```typescript
// src/domain/entities/__tests__/House.test.ts
describe('House', () => {
    it('should create a house with correct type', () => {
        const house = new House('1', 'tipo6');
        expect(house.getType()).toBe('tipo6');
    });

    it('should add piloti', () => {
        const house = new House('1', 'tipo6');
        const piloti = new Piloti('p1', 1.0);
        house.addPiloti('p1', piloti);
        expect(house.getPiloti('p1')).toBe(piloti);
    });

    it('should throw when adding duplicate piloti', () => {
        const house = new House('1', 'tipo6');
        const piloti = new Piloti('p1', 1.0);
        house.addPiloti('p1', piloti);
        expect(() => house.addPiloti('p1', piloti)).toThrow();
    });
});

// src/domain/value-objects/__tests__/Piloti.test.ts
describe('Piloti', () => {
    it('should validate height', () => {
        expect(() => new Piloti('p1', 0.5)).toThrow();
        expect(() => new Piloti('p1', 1.0)).not.toThrow();
    });

    it('should update height', () => {
        const piloti = new Piloti('p1', 1.0);
        piloti.setHeight(2.0);
        expect(piloti.getHeight()).toBe(2.0);
    });
});
```

**Tarefas:**

- [ ] Criar testes para todas as entidades
- [ ] Criar testes para value objects
- [ ] Criar testes para serviços
- [ ] Atingir 80%+ cobertura
- [ ] Configurar CI/CD

---

#### 4.2 Documentação

```markdown
# Arquitetura RAC Designer

## Estrutura de Camadas

### Domain Layer

- Contém lógica de negócio pura
- Sem dependências externas
- Totalmente testável

### Application Layer

- Orquestra casos de uso
- Usa serviços de domínio
- Define interfaces de repositório

### Infrastructure Layer

- Implementações técnicas
- Adaptadores Fabric.js
- Persistência

### Presentation Layer

- Componentes React
- Containers conectam com aplicação
- Componentes puros para apresentação
```

**Tarefas:**

- [ ] Documentar arquitetura
- [ ] Criar guia de desenvolvimento
- [ ] Documentar padrões de design
- [ ] Criar exemplos de extensão

---

## 📈 Benefícios Esperados

| Métrica                          | Antes  | Depois | Melhoria |
|----------------------------------|--------|--------|----------|
| Linhas de código (maior arquivo) | 1.697  | ~300   | -82%     |
| Número de hooks (RACEditor)      | 39     | ~5     | -87%     |
| Testabilidade                    | Baixa  | Alta   | +∞       |
| Coesão                           | Baixa  | Alta   | +80%     |
| Acoplamento                      | Alto   | Baixo  | -70%     |
| Tempo para adicionar feature     | ~2h    | ~30min | -75%     |
| Bugs em produção                 | ~5/mês | ~1/mês | -80%     |

---

## 🚀 Cronograma de Execução

```
Semana 1-2: Fundação (Domain, Repository, Services)
Semana 3-4: Separação (Canvas, RACEditor, canvas-utils)
Semana 5-6: Padrões (Strategy, Observer)
Semana 7-8: Testes e Documentação

Total: 8 semanas (2 meses)
```

---

## ✅ Checklist de Implementação

### Fase 1

- [ ] Criar estrutura de domínio
- [ ] Implementar entidades
- [ ] Criar repositório
- [ ] Criar serviços de aplicação
- [ ] Testes unitários (80%+)

### Fase 2

- [ ] Refatorar Canvas.tsx
- [ ] Refatorar RACEditor.tsx
- [ ] Refatorar canvas-utils.ts
- [ ] Testes de integração
- [ ] Validar funcionamento

### Fase 3

- [ ] Strategy Pattern
- [ ] Observer Pattern
- [ ] Factory Pattern
- [ ] Command Pattern (Undo/Redo)
- [ ] Testes

### Fase 4

- [ ] Cobertura de testes 80%+
- [ ] Documentação completa
- [ ] Guia de desenvolvimento
- [ ] Review de código
- [ ] Deploy gradual

---

## 🎯 Próximos Passos

1. **Revisar este plano** com o time
2. **Priorizar fases** conforme necessidade
3. **Criar branches** para cada fase
4. **Implementar incrementalmente**
5. **Testar continuamente**
6. **Documentar aprendizados**

---

## 📚 Referências

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Clean Code](https://www.oreilly.com/library/view/clean-code-a/9780136083238/)
- [Design Patterns](https://refactoring.guru/design-patterns)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection)
