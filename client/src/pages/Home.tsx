import { useEffect, useMemo, useRef, useState } from "react";
import {
  BoxSelect,
  Building2,
  Download,
  DoorOpen,
  FileDown,
  FolderUp,
  Grid3X3,
  HelpCircle,
  Maximize2,
  Minus,
  Move,
  MousePointer2,
  PanelRight,
  PanelsTopLeft as WindowIcon,
  PencilLine,
  Plus,
  Redo2,
  Ruler,
  Save,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

type Point = { x: number; y: number };

type Wall = {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
};

type Opening = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
};

type Room = {
  id: string;
  name: string;
  x: number;
  y: number;
  area: string;
};

type FloorPlan = {
  id: string;
  title: string;
  walls: Wall[];
  doors: Opening[];
  windows: Opening[];
  rooms: Room[];
};

type Tool = "select" | "wall" | "door" | "window";
type SelectedItem = { type: "wall" | "door" | "window"; id: string } | null;
type DragState = {
  selected: NonNullable<SelectedItem>;
  start: Point;
  baseline: FloorPlan;
};

const CANVAS = { width: 1240, height: 860 };
const STORAGE_KEY = "rac-planta-baixa-v1";

const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const createExamplePlan = (): FloorPlan => ({
  id: createId("plan"),
  title: "Planta residencial",
  walls: [
    { id: "w1", start: { x: 190, y: 140 }, end: { x: 1050, y: 140 }, thickness: 15 },
    { id: "w2", start: { x: 1050, y: 140 }, end: { x: 1050, y: 740 }, thickness: 15 },
    { id: "w3", start: { x: 1050, y: 740 }, end: { x: 190, y: 740 }, thickness: 15 },
    { id: "w4", start: { x: 190, y: 740 }, end: { x: 190, y: 140 }, thickness: 15 },
    { id: "w5", start: { x: 590, y: 140 }, end: { x: 590, y: 740 }, thickness: 12 },
    { id: "w6", start: { x: 590, y: 430 }, end: { x: 1050, y: 430 }, thickness: 12 },
    { id: "w7", start: { x: 190, y: 510 }, end: { x: 590, y: 510 }, thickness: 12 },
  ],
  doors: [
    { id: "d1", x: 590, y: 590, rotation: 90, width: 90 },
    { id: "d2", x: 780, y: 430, rotation: 0, width: 80 },
    { id: "d3", x: 300, y: 510, rotation: 0, width: 80 },
  ],
  windows: [
    { id: "win1", x: 370, y: 140, rotation: 0, width: 130 },
    { id: "win2", x: 850, y: 140, rotation: 0, width: 150 },
    { id: "win3", x: 1050, y: 620, rotation: 90, width: 130 },
  ],
  rooms: [
    { id: "r1", name: "SALA", x: 390, y: 320, area: "21,8 m²" },
    { id: "r2", name: "COZINHA", x: 390, y: 630, area: "12,0 m²" },
    { id: "r3", name: "QUARTO", x: 820, y: 285, area: "16,4 m²" },
    { id: "r4", name: "BANHO", x: 820, y: 590, area: "10,2 m²" },
  ],
});

const emptyPlan = (): FloorPlan => ({
  id: createId("plan"),
  title: "Nova planta",
  walls: [],
  doors: [],
  windows: [],
  rooms: [],
});

function safeInitialPlan() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as FloorPlan;
      if (Array.isArray(parsed.walls) && Array.isArray(parsed.doors) && Array.isArray(parsed.windows)) {
        return parsed;
      }
    }
  } catch {
    // A planta de exemplo continua disponível se o cache local estiver inválido.
  }
  return createExamplePlan();
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const wallLength = (wall: Wall) => distance(wall.start, wall.end);

const downloadFile = (content: BlobPart, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const fileNameFrom = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "planta";

function nearestPointOnWall(point: Point, wall: Wall) {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const lengthSquared = dx * dx + dy * dy;
  const raw = lengthSquared === 0 ? 0 : ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) / lengthSquared;
  const t = Math.min(1, Math.max(0, raw));
  return {
    point: { x: wall.start.x + t * dx, y: wall.start.y + t * dy },
    distance: Math.hypot(point.x - (wall.start.x + t * dx), point.y - (wall.start.y + t * dy)),
    rotation: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}

function buildSvgExport(plan: FloorPlan) {
  const wallMarkup = plan.walls
    .map(
      (wall) =>
        `<line x1="${wall.start.x}" y1="${wall.start.y}" x2="${wall.end.x}" y2="${wall.end.y}" stroke="#202a35" stroke-width="${wall.thickness}" stroke-linecap="square" />`,
    )
    .join("");
  const windowMarkup = plan.windows
    .map(
      (opening) =>
        `<g transform="translate(${opening.x} ${opening.y}) rotate(${opening.rotation})"><line x1="${-opening.width / 2}" y1="0" x2="${opening.width / 2}" y2="0" stroke="#f7f9fb" stroke-width="20"/><line x1="${-opening.width / 2}" y1="0" x2="${opening.width / 2}" y2="0" stroke="#2f97b1" stroke-width="8"/></g>`,
    )
    .join("");
  const doorMarkup = plan.doors
    .map((opening) => {
      const half = opening.width / 2;
      return `<g transform="translate(${opening.x} ${opening.y}) rotate(${opening.rotation})"><line x1="${-half}" y1="0" x2="${half}" y2="0" stroke="#f7f9fb" stroke-width="20"/><path d="M ${-half} 0 L ${-half} ${-opening.width} A ${opening.width} ${opening.width} 0 0 1 ${half} 0" fill="none" stroke="#8d5b3a" stroke-width="3"/></g>`;
    })
    .join("");
  const roomMarkup = plan.rooms
    .map(
      (room) =>
        `<text x="${room.x}" y="${room.y}" text-anchor="middle" fill="#596574" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="2">${room.name}</text><text x="${room.x}" y="${room.y + 25}" text-anchor="middle" fill="#87919d" font-family="Arial, sans-serif" font-size="12">${room.area}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS.width}" height="${CANVAS.height}" viewBox="0 0 ${CANVAS.width} ${CANVAS.height}"><rect width="100%" height="100%" fill="#f7f9fb"/>${wallMarkup}${windowMarkup}${doorMarkup}${roomMarkup}</svg>`;
}

export default function Home() {
  const [plan, setPlan] = useState<FloorPlan>(safeInitialPlan);
  const [history, setHistory] = useState<FloorPlan[]>(() => [plan]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [selected, setSelected] = useState<SelectedItem>(null);
  const [draftStart, setDraftStart] = useState<Point | null>(null);
  const [pointerPosition, setPointerPosition] = useState<Point | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [panning, setPanning] = useState<{ start: Point; pan: Point } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const planRef = useRef(plan);
  const historyIndexRef = useRef(historyIndex);

  useEffect(() => {
    planRef.current = plan;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

  const commit = (nextPlan: FloorPlan) => {
    const nextIndex = historyIndexRef.current + 1;
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    setHistory((current) => [...current.slice(0, nextIndex), nextPlan]);
    planRef.current = nextPlan;
    setPlan(nextPlan);
  };

  const setPlanWithoutHistory = (nextPlan: FloorPlan) => {
    planRef.current = nextPlan;
    setPlan(nextPlan);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    setPlanWithoutHistory(history[nextIndex]);
    setSelected(null);
    toast.message("Alteração desfeita");
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    setPlanWithoutHistory(history[nextIndex]);
    setSelected(null);
    toast.message("Alteração refeita");
  };

  const getSvgPoint = (event: React.MouseEvent<SVGElement>): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const result = point.matrixTransform(matrix.inverse());
    return { x: result.x, y: result.y };
  };

  const snapPoint = (point: Point): Point => {
    const gridPoint = { x: Math.round(point.x / 20) * 20, y: Math.round(point.y / 20) * 20 };
    const endpoints = planRef.current.walls.flatMap((wall) => [wall.start, wall.end]);
    const closePoint = endpoints.find((endpoint) => distance(gridPoint, endpoint) < 16);
    return closePoint ?? gridPoint;
  };

  const getWorldPoint = (event: React.MouseEvent<SVGElement>) => {
    const raw = getSvgPoint(event);
    return snapPoint({ x: (raw.x - pan.x) / zoom, y: (raw.y - pan.y) / zoom });
  };

  const setTool = (tool: Tool) => {
    setActiveTool(tool);
    setDraftStart(null);
    setPointerPosition(null);
  };

  const addOpening = (type: "door" | "window", point: Point) => {
    const nearest = planRef.current.walls
      .map((wall) => nearestPointOnWall(point, wall))
      .sort((a, b) => a.distance - b.distance)[0];
    const opening: Opening = {
      id: createId(type),
      x: nearest && nearest.distance < 40 ? nearest.point.x : point.x,
      y: nearest && nearest.distance < 40 ? nearest.point.y : point.y,
      rotation: nearest && nearest.distance < 40 ? nearest.rotation : 0,
      width: type === "door" ? 90 : 120,
    };
    const nextPlan = {
      ...planRef.current,
      [type === "door" ? "doors" : "windows"]: [
        ...planRef.current[type === "door" ? "doors" : "windows"],
        opening,
      ],
    };
    commit(nextPlan);
    setSelected({ type, id: opening.id });
    setTool("select");
    toast.success(type === "door" ? "Porta adicionada" : "Janela adicionada");
  };

  const handleCanvasPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button === 1 || event.shiftKey) {
      event.preventDefault();
      setPanning({ start: getSvgPoint(event), pan });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const point = getWorldPoint(event);
    if (activeTool === "wall") {
      if (!draftStart) {
        setDraftStart(point);
        setPointerPosition(point);
        toast.message("Escolha o ponto final da parede");
      } else if (distance(draftStart, point) > 10) {
        const wall: Wall = { id: createId("wall"), start: draftStart, end: point, thickness: 15 };
        commit({ ...planRef.current, walls: [...planRef.current.walls, wall] });
        setDraftStart(point);
      }
      return;
    }

    if (activeTool === "door" || activeTool === "window") {
      addOpening(activeTool, point);
      return;
    }

    setSelected(null);
  };

  const handleElementPointerDown = (
    event: React.PointerEvent<SVGGElement>,
    item: NonNullable<SelectedItem>,
  ) => {
    if (activeTool !== "select") return;
    event.stopPropagation();
    const point = getWorldPoint(event);
    setSelected(item);
    setDragging({ selected: item, start: point, baseline: planRef.current });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveSelected = (baseline: FloorPlan, item: NonNullable<SelectedItem>, delta: Point) => {
    if (item.type === "wall") {
      return {
        ...baseline,
        walls: baseline.walls.map((wall) =>
          wall.id === item.id
            ? {
                ...wall,
                start: { x: wall.start.x + delta.x, y: wall.start.y + delta.y },
                end: { x: wall.end.x + delta.x, y: wall.end.y + delta.y },
              }
            : wall,
        ),
      };
    }
    const key = item.type === "door" ? "doors" : "windows";
    return {
      ...baseline,
      [key]: baseline[key].map((opening) =>
        opening.id === item.id ? { ...opening, x: opening.x + delta.x, y: opening.y + delta.y } : opening,
      ),
    };
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const raw = getSvgPoint(event);
    if (panning) {
      setPan({ x: panning.pan.x + raw.x - panning.start.x, y: panning.pan.y + raw.y - panning.start.y });
      return;
    }
    const point = getWorldPoint(event);
    setPointerPosition(point);
    if (dragging) {
      const next = moveSelected(dragging.baseline, dragging.selected, {
        x: point.x - dragging.start.x,
        y: point.y - dragging.start.y,
      });
      setPlanWithoutHistory(next);
    }
  };

  const finishPointerAction = () => {
    if (dragging) {
      const changed = JSON.stringify(dragging.baseline) !== JSON.stringify(planRef.current);
      if (changed) commit(planRef.current);
    }
    setDragging(null);
    setPanning(null);
  };

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const raw = getSvgPoint(event);
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    const nextZoom = Math.max(0.55, Math.min(2.5, zoom * factor));
    const worldX = (raw.x - pan.x) / zoom;
    const worldY = (raw.y - pan.y) / zoom;
    setPan({ x: raw.x - worldX * nextZoom, y: raw.y - worldY * nextZoom });
    setZoom(nextZoom);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const deleteSelected = () => {
    if (!selected) return;
    const key = selected.type === "wall" ? "walls" : selected.type === "door" ? "doors" : "windows";
    commit({ ...planRef.current, [key]: planRef.current[key].filter((item) => item.id !== selected.id) });
    setSelected(null);
    toast.success("Elemento removido");
  };

  const newPlan = () => {
    if (plan.walls.length && !window.confirm("Criar uma nova planta? O desenho atual continuará salvo apenas no histórico desta sessão.")) {
      return;
    }
    commit(emptyPlan());
    setSelected(null);
    setDraftStart(null);
    resetView();
    toast.success("Nova planta criada");
  };

  const exportJson = () => {
    downloadFile(JSON.stringify(plan, null, 2), `${fileNameFrom(plan.title)}.json`, "application/json");
    toast.success("Arquivo JSON baixado");
  };

  const exportSvg = () => {
    downloadFile(buildSvgExport(plan), `${fileNameFrom(plan.title)}.svg`, "image/svg+xml");
    toast.success("Planta em SVG baixada");
  };

  const importPlan = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result)) as FloorPlan;
        if (!Array.isArray(imported.walls) || !Array.isArray(imported.doors) || !Array.isArray(imported.windows)) {
          throw new Error("Estrutura inválida");
        }
        commit({ ...emptyPlan(), ...imported, id: createId("plan"), rooms: imported.rooms ?? [] });
        setSelected(null);
        resetView();
        toast.success("Planta importada");
      } catch {
        toast.error("Não foi possível ler esse arquivo de planta");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if (event.key === "Delete" || event.key === "Backspace") deleteSelected();
      if (event.key.toLowerCase() === "v") setTool("select");
      if (event.key.toLowerCase() === "p") setTool("wall");
      if (event.key === "Escape") {
        setDraftStart(null);
        setSelected(null);
        setTool("select");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, history, selected]);

  const selectedData = useMemo(() => {
    if (!selected) return null;
    if (selected.type === "wall") {
      const wall = plan.walls.find((item) => item.id === selected.id);
      return wall ? { label: "Parede", dimension: `${(wallLength(wall) / 100).toFixed(2)} m`, detail: `${wall.thickness} cm de espessura` } : null;
    }
    const collection = selected.type === "door" ? plan.doors : plan.windows;
    const opening = collection.find((item) => item.id === selected.id);
    return opening
      ? { label: selected.type === "door" ? "Porta" : "Janela", dimension: `${(opening.width / 100).toFixed(2)} m`, detail: `${Math.round(opening.rotation)}° de orientação` }
      : null;
  }, [plan, selected]);

  const tools: Array<{ id: Tool; label: string; shortcut: string; icon: typeof MousePointer2 }> = [
    { id: "select", label: "Selecionar", shortcut: "V", icon: MousePointer2 },
    { id: "wall", label: "Parede", shortcut: "P", icon: PencilLine },
    { id: "door", label: "Porta", shortcut: "", icon: DoorOpen },
    { id: "window", label: "Janela", shortcut: "", icon: WindowIcon },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#e8ebe8] font-sans text-[#1e2935]">
      <header className="flex h-[68px] items-center justify-between border-b border-white/10 bg-[#18222d] px-4 text-white shadow-[0_5px_22px_rgba(24,34,45,0.18)] sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-9 w-9 shrink-0 grid-cols-2 gap-[3px] rounded-[10px] bg-[#54b5c4] p-[6px] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
            <span className="rounded-sm bg-[#18222d]" />
            <span className="rounded-sm bg-[#e9e5d5]" />
            <span className="rounded-sm bg-[#e9e5d5]" />
            <span className="rounded-sm bg-[#18222d]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-serif text-[18px] font-bold tracking-[-0.03em]">RAC Planta</span>
              <span className="hidden rounded-full border border-[#6cc8d4]/30 bg-[#6cc8d4]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8ed8e0] sm:inline">Beta</span>
            </div>
            <p className="hidden text-[11px] tracking-[0.08em] text-[#aab6be] sm:block">EDITOR DE PLANTA BAIXA</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 text-xs text-[#afbbc2] md:flex">
          <Save className="h-3.5 w-3.5 text-[#6cc8d4]" />
          <span>Salvo neste navegador</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => uploadRef.current?.click()} className="hidden h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-[#d7e1e4] transition hover:bg-white/10 sm:flex" title="Importar uma planta em JSON">
            <Upload className="h-4 w-4" /> Importar
          </button>
          <button onClick={exportJson} className="hidden h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-[#d7e1e4] transition hover:bg-white/10 sm:flex" title="Baixar os dados da planta">
            <Download className="h-4 w-4" /> JSON
          </button>
          <button onClick={exportSvg} className="flex h-9 items-center gap-2 rounded-lg bg-[#61bdca] px-3 text-xs font-bold text-[#14212b] shadow-[0_2px_0_rgba(255,255,255,0.23)_inset] transition hover:bg-[#79cbd5] active:scale-[0.97] sm:px-4" title="Exportar a planta como SVG vetorial">
            <FileDown className="h-4 w-4" /> <span className="hidden sm:inline">Exportar</span>
          </button>
          <input ref={uploadRef} type="file" accept="application/json" className="hidden" onChange={importPlan} />
        </div>
      </header>

      <main className="grid h-[calc(100vh-68px)] min-h-[640px] grid-cols-[76px_minmax(0,1fr)] xl:grid-cols-[76px_minmax(0,1fr)_250px]">
        <aside className="flex flex-col items-center border-r border-[#d9dfdf] bg-[#f5f6f3] py-4 shadow-[5px_0_16px_rgba(42,54,62,0.03)]">
          <div className="flex w-full flex-col items-center gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setTool(tool.id)}
                  title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ""}`}
                  className={`group relative flex h-[54px] w-[54px] flex-col items-center justify-center rounded-xl border text-[9px] font-bold transition ${
                    isActive
                      ? "border-[#8bd0d8] bg-[#dff3f4] text-[#1f7280] shadow-[0_5px_12px_rgba(54,143,157,0.12)]"
                      : "border-transparent text-[#67737e] hover:border-[#d5dedf] hover:bg-white hover:text-[#1e2935]"
                  }`}
                >
                  <Icon className="mb-1 h-[18px] w-[18px] stroke-[1.8]" />
                  {tool.label}
                  {tool.shortcut && <span className="absolute -right-2 -top-1 rounded bg-[#25313d] px-1 py-0.5 text-[8px] text-white opacity-0 shadow-sm transition group-hover:opacity-100">{tool.shortcut}</span>}
                </button>
              );
            })}
          </div>
          <div className="my-4 h-px w-8 bg-[#dbe1df]" />
          <button onClick={deleteSelected} disabled={!selected} title="Remover elemento selecionado" className="flex h-10 w-10 items-center justify-center rounded-lg text-[#8a959d] transition hover:bg-[#fbe9e7] hover:text-[#bd4b40] disabled:cursor-not-allowed disabled:opacity-35">
            <Trash2 className="h-[18px] w-[18px]" />
          </button>
          <div className="mt-auto flex flex-col gap-2">
            <button onClick={undo} disabled={historyIndex === 0} title="Desfazer (Ctrl/Cmd + Z)" className="flex h-10 w-10 items-center justify-center rounded-lg text-[#68747d] transition hover:bg-white hover:text-[#25313d] disabled:opacity-30">
              <Undo2 className="h-[18px] w-[18px]" />
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Refazer (Ctrl/Cmd + Shift + Z)" className="flex h-10 w-10 items-center justify-center rounded-lg text-[#68747d] transition hover:bg-white hover:text-[#25313d] disabled:opacity-30">
              <Redo2 className="h-[18px] w-[18px]" />
            </button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col bg-[#e9edeb] p-3 sm:p-5">
          <div className="mb-3 flex min-h-10 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden h-8 w-8 items-center justify-center rounded-lg border border-[#cfd9d8] bg-[#f7f8f6] text-[#3c4955] shadow-sm sm:flex"><Building2 className="h-4 w-4" /></div>
              <div className="min-w-0">
                <input
                  value={plan.title}
                  onChange={(event) => setPlanWithoutHistory({ ...planRef.current, title: event.target.value })}
                  className="w-full max-w-[240px] truncate bg-transparent font-serif text-[18px] font-bold tracking-[-0.02em] text-[#25303a] outline-none placeholder:text-[#87919a] focus:text-[#136f7e]"
                  aria-label="Nome da planta"
                />
                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7b8790] sm:block">Escala aproximada 1:100 · centímetros</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-lg border border-[#d4dcd9] bg-[#f6f7f4] p-1 shadow-[0_2px_7px_rgba(48,61,69,0.06)]">
              <button onClick={() => setZoom((value) => Math.max(0.55, value - 0.1))} className="flex h-7 w-7 items-center justify-center rounded-md text-[#5d6973] transition hover:bg-white hover:text-[#1e2935]" title="Diminuir zoom"><Minus className="h-3.5 w-3.5" /></button>
              <button onClick={resetView} className="min-w-11 px-1 text-[10px] font-bold tabular-nums text-[#4b5a64]" title="Redefinir visualização">{Math.round(zoom * 100)}%</button>
              <button onClick={() => setZoom((value) => Math.min(2.5, value + 0.1))} className="flex h-7 w-7 items-center justify-center rounded-md text-[#5d6973] transition hover:bg-white hover:text-[#1e2935]" title="Aumentar zoom"><Plus className="h-3.5 w-3.5" /></button>
              <span className="mx-0.5 h-4 w-px bg-[#d7dfdc]" />
              <button onClick={resetView} className="flex h-7 w-7 items-center justify-center rounded-md text-[#5d6973] transition hover:bg-white hover:text-[#1e2935]" title="Ajustar visualização"><Maximize2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-[#ccd6d5] bg-[#f8faf9] shadow-[0_12px_35px_rgba(39,53,61,0.12)]">
            <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-[#d2dcd9] bg-[#fdfefd]/95 p-1.5 shadow-[0_3px_12px_rgba(42,54,62,0.10)] backdrop-blur">
              <span className="px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7781]">{activeTool === "select" ? "Seleção" : activeTool === "wall" ? "Desenhar parede" : activeTool === "door" ? "Inserir porta" : "Inserir janela"}</span>
              {draftStart && <button onClick={() => setDraftStart(null)} className="rounded-md bg-[#f0f2ef] px-2 py-1 text-[10px] font-bold text-[#586671] transition hover:bg-[#e2e8e5]">Cancelar</button>}
            </div>

            <svg
              ref={svgRef}
              viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
              className={`h-full w-full touch-none select-none ${activeTool === "wall" ? "cursor-crosshair" : activeTool === "door" || activeTool === "window" ? "cursor-copy" : dragging || panning ? "cursor-grabbing" : "cursor-default"}`}
              onContextMenu={(event) => event.preventDefault()}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={finishPointerAction}
              onPointerCancel={finishPointerAction}
              onWheel={handleWheel}
            >
              <defs>
                <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#dce4e1" strokeWidth="0.65" />
                </pattern>
                <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                  <rect width="100" height="100" fill="url(#smallGrid)" />
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#c7d3d0" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width={CANVAS.width} height={CANVAS.height} fill="#f9fbfa" />
              <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
                <rect x="-300" y="-300" width="1840" height="1460" fill="url(#grid)" />
                <g opacity="0.96" pointerEvents="none">
                  {plan.rooms.map((room) => (
                    <g key={room.id} transform={`translate(${room.x} ${room.y})`}>
                      <text textAnchor="middle" y="-5" className="fill-[#66737d] text-[15px] font-bold tracking-[0.18em]">{room.name}</text>
                      <text textAnchor="middle" y="20" className="fill-[#909ba3] text-[12px] font-medium">{room.area}</text>
                    </g>
                  ))}
                </g>

                {plan.walls.map((wall) => {
                  const isSelected = selected?.type === "wall" && selected.id === wall.id;
                  return (
                    <g key={wall.id} onPointerDown={(event) => handleElementPointerDown(event, { type: "wall", id: wall.id })} className="cursor-grab active:cursor-grabbing">
                      <line x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} stroke="transparent" strokeWidth={36} />
                      {isSelected && <line x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} stroke="#79cfda" strokeWidth={wall.thickness + 12} strokeLinecap="square" opacity="0.72" />}
                      <line x1={wall.start.x} y1={wall.start.y} x2={wall.end.x} y2={wall.end.y} stroke="#202a35" strokeWidth={wall.thickness} strokeLinecap="square" />
                    </g>
                  );
                })}

                {plan.windows.map((opening) => {
                  const isSelected = selected?.type === "window" && selected.id === opening.id;
                  return (
                    <g key={opening.id} transform={`translate(${opening.x} ${opening.y}) rotate(${opening.rotation})`} onPointerDown={(event) => handleElementPointerDown(event, { type: "window", id: opening.id })} className="cursor-grab active:cursor-grabbing">
                      {isSelected && <rect x={-opening.width / 2 - 10} y="-14" width={opening.width + 20} height="28" rx="3" fill="#77d0dc" opacity="0.64" />}
                      <line x1={-opening.width / 2} y1="0" x2={opening.width / 2} y2="0" stroke="#f9fbfa" strokeWidth="22" />
                      <line x1={-opening.width / 2} y1="0" x2={opening.width / 2} y2="0" stroke="#2b92aa" strokeWidth="8" />
                      <line x1={-opening.width / 2} y1="-4" x2={opening.width / 2} y2="-4" stroke="#99d3df" strokeWidth="2" />
                    </g>
                  );
                })}

                {plan.doors.map((opening) => {
                  const isSelected = selected?.type === "door" && selected.id === opening.id;
                  const half = opening.width / 2;
                  return (
                    <g key={opening.id} transform={`translate(${opening.x} ${opening.y}) rotate(${opening.rotation})`} onPointerDown={(event) => handleElementPointerDown(event, { type: "door", id: opening.id })} className="cursor-grab active:cursor-grabbing">
                      {isSelected && <rect x={-half - 10} y={-opening.width - 10} width={opening.width + 20} height={opening.width + 20} rx="3" fill="#77d0dc" opacity="0.5" />}
                      <line x1={-half} y1="0" x2={half} y2="0" stroke="#f9fbfa" strokeWidth="23" />
                      <path d={`M ${-half} 0 L ${-half} ${-opening.width} A ${opening.width} ${opening.width} 0 0 1 ${half} 0`} fill="none" stroke="#965f3c" strokeWidth="3" />
                      <line x1={-half} y1="0" x2={-half} y2={-opening.width} stroke="#775039" strokeWidth="5" />
                    </g>
                  );
                })}

                {draftStart && pointerPosition && (
                  <g pointerEvents="none">
                    <line x1={draftStart.x} y1={draftStart.y} x2={pointerPosition.x} y2={pointerPosition.y} stroke="#3cabb9" strokeWidth="15" strokeLinecap="square" strokeDasharray="10 6" opacity="0.9" />
                    <circle cx={draftStart.x} cy={draftStart.y} r="6" fill="#1b8c9b" />
                  </g>
                )}
                {pointerPosition && activeTool === "wall" && !draftStart && <circle cx={pointerPosition.x} cy={pointerPosition.y} r="4" fill="#1b8c9b" pointerEvents="none" />}
              </g>
            </svg>

            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md border border-[#d0dad7] bg-[#fdfefd]/95 px-2.5 py-1.5 text-[10px] font-semibold text-[#63707a] shadow-sm backdrop-blur">
              <Grid3X3 className="h-3.5 w-3.5 text-[#4d9cab]" /> Grade 20 cm
              <span className="h-3 w-px bg-[#d5ddda]" />
              <Move className="h-3.5 w-3.5" /> Shift + arraste para mover
            </div>
            <div className="absolute bottom-3 right-3 hidden rounded-md border border-[#d0dad7] bg-[#fdfefd]/95 px-2.5 py-1.5 font-mono text-[10px] text-[#63707a] shadow-sm backdrop-blur sm:block">
              {pointerPosition ? `X ${pointerPosition.x} · Y ${pointerPosition.y}` : "X — · Y —"}
            </div>
          </div>
        </section>

        <aside className="hidden border-l border-[#d5ddda] bg-[#f6f7f4] xl:flex xl:flex-col">
          <div className="border-b border-[#d9e0dd] px-5 py-5">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#80909a]"><PanelRight className="h-3.5 w-3.5" /> Propriedades</div>
            <h2 className="font-serif text-[20px] font-bold tracking-[-0.02em] text-[#26313a]">{selectedData?.label ?? "Planta"}</h2>
          </div>

          <div className="p-5">
            {selectedData ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#d7dfdc] bg-white p-4 shadow-[0_3px_10px_rgba(49,62,69,0.04)]">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[#85919a]">Dimensão</p>
                  <p className="font-serif text-[26px] font-bold tracking-[-0.04em] text-[#25313a]">{selectedData.dimension}</p>
                  <p className="mt-1 text-xs text-[#6e7b85]">{selectedData.detail}</p>
                </div>
                <button onClick={deleteSelected} className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e7c7c2] bg-[#fffafa] px-3 py-2.5 text-xs font-bold text-[#b64e44] transition hover:bg-[#fbece9]"><Trash2 className="h-3.5 w-3.5" /> Remover elemento</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#d7dfdc] bg-white p-4 shadow-[0_3px_10px_rgba(49,62,69,0.04)]">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.13em] text-[#85919a]">Resumo</p>
                  <dl className="space-y-3">
                    <div className="flex items-center justify-between text-xs"><dt className="text-[#6e7b85]">Paredes</dt><dd className="font-bold text-[#27343d]">{plan.walls.length}</dd></div>
                    <div className="flex items-center justify-between text-xs"><dt className="text-[#6e7b85]">Portas</dt><dd className="font-bold text-[#27343d]">{plan.doors.length}</dd></div>
                    <div className="flex items-center justify-between text-xs"><dt className="text-[#6e7b85]">Janelas</dt><dd className="font-bold text-[#27343d]">{plan.windows.length}</dd></div>
                  </dl>
                </div>
                <button onClick={newPlan} className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#cbd7d5] bg-white px-3 py-2.5 text-xs font-bold text-[#3a4a55] transition hover:border-[#a8c7c9] hover:bg-[#f5fbfa]"><Plus className="h-3.5 w-3.5" /> Nova planta</button>
              </div>
            )}
          </div>

          <div className="mt-auto border-t border-[#d9e0dd] p-5">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#80909a]"><HelpCircle className="h-3.5 w-3.5" /> Guia rápido</div>
            <ul className="space-y-2.5 text-[11px] leading-relaxed text-[#687680]">
              <li className="flex gap-2"><BoxSelect className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#48a8b6]" /> Selecione e arraste elementos para reposicioná-los.</li>
              <li className="flex gap-2"><Ruler className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#48a8b6]" /> Clique duas vezes com a ferramenta Parede para criar segmentos contínuos.</li>
              <li className="flex gap-2"><FolderUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#48a8b6]" /> Exporte em JSON para preservar a edição ou SVG para compartilhar.</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
