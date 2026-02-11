import { Group, FabricObject, Canvas as FabricCanvas } from 'fabric';
import {
  updatePilotiHeight,
  updatePilotiMaster,
  updateGroundInGroup,
  refreshHouseGroupRendering,
  formatPilotiHeight,
  MASTER_PILOTI_FILL,
  MASTER_PILOTI_STROKE,
  BASE_PILOTI_HEIGHT_PX,
  CORNER_PILOTI_IDS,
} from './canvas-utils';

// Types for house sides
export type HouseSide = 'top' | 'bottom' | 'left' | 'right';
export type ViewType = 'top' | 'front' | 'back' | 'side1' | 'side2';
export type HouseType = 'tipo6' | 'tipo3' | null;

// Mapping between sides and view types
// Front/Back can only be on top/bottom (longer sides)
// Side1/Side2 can only be on left/right (shorter sides)
export const SIDE_VIEW_MAPPING: Record<HouseSide, ViewType[]> = {
  top: ['front', 'back'],
  bottom: ['front', 'back'],
  left: ['side1', 'side2'],
  right: ['side1', 'side2'],
};

// Opposite sides
export const OPPOSITE_SIDE: Record<HouseSide, HouseSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

// Opposite views
export const OPPOSITE_VIEW: Record<ViewType, ViewType | null> = {
  top: null,
  front: 'back',
  back: 'front',
  side1: 'side2',
  side2: 'side1',
};

// Piloti data structure
export interface PilotiData {
  height: number;
  isMaster: boolean;
  nivel: number;
}

// Window/Door element types
export type ElementType = 'window' | 'door';

// Element position on house face (using absolute pixel dimensions matching 2D canvas)
export interface HouseElement {
  id: string;
  type: ElementType;
  face: 'front' | 'back' | 'left' | 'right'; // Which face of the house
  x: number; // X position in pixels from left edge of house body
  y: number; // Y position in pixels from top of house body
  width: number; // Width in pixels (e.g., 90 for window, 100 for door)
  height: number; // Height in pixels (e.g., 75 for window, 180 for door)
}

// View instance for tracking multiple views of the same type
export interface ViewInstance {
  group: Group;
  side?: HouseSide;
  instanceId: string;
}

// House state
export interface HouseState {
  id: string;
  houseType: HouseType;
  pilotis: Record<string, PilotiData>; // pilotiId -> data
  elements: HouseElement[]; // Windows and doors
  views: Record<ViewType, ViewInstance[]>; // Changed to array for multiple instances
  sideAssignments: Record<HouseSide, ViewType | null>;
  preAssignedSlots: Record<string, HouseSide>;
}

// View limits per house type
export const VIEW_LIMITS: Record<Exclude<HouseType, null>, Record<ViewType, number>> = {
  tipo6: {
    top: 1,
    front: 1,
    back: 1,
    side1: 2, // Quadrado Fechado
    side2: 0, // Not available for tipo6
  },
  tipo3: {
    top: 1,
    front: 0, // Not available for tipo3
    back: 2, // "Lateral" (renamed for tipo3)
    side1: 1, // Quadrado Fechado
    side2: 1, // Quadrado Aberto
  },
};

// Default piloti data
const DEFAULT_PILOTI: PilotiData = {
  height: 1.0,
  isMaster: false,
  nivel: 0.3,
};

// Generate all piloti IDs (A1-C4)
function getAllPilotiIds(): string[] {
  const ids: string[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      ids.push(`piloti_${col}_${row}`);
    }
  }
  return ids;
}

class HouseManager {
  private house: HouseState | null = null;
  private canvas: FabricCanvas | null = null;
  private listeners = new Set<() => void>();

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  initialize(canvas: FabricCanvas): void {
    this.canvas = canvas;
    this.reset();
  }

  reset(): void {
    // Initialize with default piloti data
    const pilotis: Record<string, PilotiData> = {};
    getAllPilotiIds().forEach((id) => {
      pilotis[id] = { ...DEFAULT_PILOTI };
    });

    this.house = {
      id: `house_${Date.now()}`,
      houseType: null,
      pilotis,
      elements: [], // Windows and doors
      views: {
        top: [],
        front: [],
        back: [],
        side1: [],
        side2: [],
      },
      sideAssignments: {
        top: null,
        bottom: null,
        left: null,
        right: null,
      },
      preAssignedSlots: {},
    };

    this.notify();
  }

  // Get/Set house type
  getHouseType(): HouseType {
    return this.house?.houseType || null;
  }

  setHouseType(type: HouseType): void {
    if (!this.house) return;
    this.house.houseType = type;
    if (type === null) {
      this.house.preAssignedSlots = {};
    }
    this.notify();
  }

  // Get max count for a view type based on current house type
  getMaxViewCount(viewType: ViewType): number {
    if (!this.house?.houseType) return 0;
    return VIEW_LIMITS[this.house.houseType][viewType];
  }

  // Get current count of a view type
  getViewCount(viewType: ViewType): number {
    if (!this.house) return 0;
    return this.house.views[viewType].length;
  }

  // Check if can add more of this view type
  canAddView(viewType: ViewType): boolean {
    if (!this.house?.houseType) return false;
    const max = this.getMaxViewCount(viewType);
    const current = this.getViewCount(viewType);
    return current < max;
  }

  // Get available views for current house type (views that can still be added)
  getAvailableViewsForType(): ViewType[] {
    if (!this.house?.houseType) return [];
    
    const views: ViewType[] = [];
    const limits = VIEW_LIMITS[this.house.houseType];
    
    for (const [viewType, maxCount] of Object.entries(limits)) {
      if (maxCount > 0 && this.canAddView(viewType as ViewType)) {
        views.push(viewType as ViewType);
      }
    }
    
    return views;
  }

  // Check if plant (top view) can be deleted
  canDeletePlant(): boolean {
    if (!this.house) return false;
    
    // Check if any other views exist
    const otherViews = (['front', 'back', 'side1', 'side2'] as ViewType[]).some(
      (vt) => this.house!.views[vt].length > 0
    );
    
    return !otherViews;
  }

  // Check if any non-plant views exist
  hasOtherViews(): boolean {
    if (!this.house) return false;
    return (['front', 'back', 'side1', 'side2'] as ViewType[]).some(
      (vt) => this.house!.views[vt].length > 0
    );
  }

  getHouse(): HouseState | null {
    return this.house;
  }

  private isGroupOnCanvas(group: Group): boolean {
    if (!this.canvas) return false;
    return this.canvas.getObjects().includes(group as any);
  }

  private cleanupStaleViews(viewType: ViewType): void {
    if (!this.house) return;
    const instances = this.house.views[viewType];
    if (!instances || instances.length === 0) return;

    // Filter out instances whose groups are no longer on canvas
    const validInstances: ViewInstance[] = [];
    for (const instance of instances) {
      if (this.isGroupOnCanvas(instance.group)) {
        validInstances.push(instance);
      } else {
        // Clear side assignment if this instance had one
        if (instance.side) {
          this.house.sideAssignments[instance.side] = null;
        }
      }
    }
    this.house.views[viewType] = validInstances;
  }

  hasView(viewType: ViewType): boolean {
    // When house isn't initialized yet, no views exist.
    if (!this.house) return false;

    this.cleanupStaleViews(viewType);
    return this.house.views[viewType].length > 0;
  }

  // Check if this specific view type has reached its maximum
  isViewAtLimit(viewType: ViewType): boolean {
    if (!this.house?.houseType) return true;
    this.cleanupStaleViews(viewType);
    return this.house.views[viewType].length >= this.getMaxViewCount(viewType);
  }

  getAvailableViews(): ViewType[] {
    if (!this.house) return [];
    return (['top', 'front', 'back', 'side1', 'side2'] as ViewType[]).filter(
      (v) => !this.isViewAtLimit(v)
    );
  }

  // Get which sides are available for a given view type
  getAvailableSides(viewType: ViewType): HouseSide[] {
    if (!this.house) return [];

    const possibleSides = Object.entries(SIDE_VIEW_MAPPING)
      .filter(([_, views]) => views.includes(viewType))
      .map(([side]) => side as HouseSide);

    return possibleSides.filter((side) => {
      const assignment = this.house!.sideAssignments[side];
      // Side is available if not assigned
      return assignment === null;
    });
  }

  // Check if user needs to select a side for this view
  // ALWAYS ask user for side selection when there are available sides
  needsSideSelection(viewType: ViewType): boolean {
    if (viewType === 'top') return false; // Top view doesn't need side selection
    
    const availableSides = this.getAvailableSides(viewType);
    if (availableSides.length === 0) return false; // No sides available
    
    // Always ask user to select a side if there are available sides
    return true;
  }

  // Get the auto-selected side if only one is available or opposite is assigned
  getAutoSelectedSide(viewType: ViewType): HouseSide | null {
    if (viewType === 'top') return null;
    
    const availableSides = this.getAvailableSides(viewType);
    if (availableSides.length === 1) return availableSides[0];
    if (availableSides.length === 0) return null;
    
    // Check if any instance of the opposite view has a side, then use the opposite side
    const oppositeView = OPPOSITE_VIEW[viewType];
    if (oppositeView && this.house?.views[oppositeView]?.length) {
      const oppositeInstances = this.house.views[oppositeView];
      // Find an instance that has a side assigned
      for (const instance of oppositeInstances) {
        if (instance.side) {
          const oppositeSide = OPPOSITE_SIDE[instance.side];
          if (availableSides.includes(oppositeSide)) {
            return oppositeSide;
          }
        }
      }
    }
    
    return null;
  }

  // Register a view with its group and side
  registerView(viewType: ViewType, group: Group, side?: HouseSide): void {
    if (!this.house) return;

    const instanceId = `${viewType}_${Date.now()}`;
    
    // Mark the group with its view type and instance ID for later identification
    (group as any).houseViewType = viewType;
    (group as any).houseInstanceId = instanceId;

    // Apply current piloti data to the new group
    this.applyPilotiDataToGroup(group);

    // Add to the array of instances for this view type
    this.house.views[viewType].push({ group, side, instanceId });

    if (side) {
      this.house.sideAssignments[side] = viewType;
    }

    console.log(`[HouseManager] Registered view ${viewType}, instance: ${instanceId}, side: ${side}`);
    this.notify();
  }

  // Remove a view (when deleted from canvas)
  removeView(group: Group): void {
    if (!this.house) return;

    // First try to identify by the houseViewType and instanceId properties
    const viewType = (group as any).houseViewType as ViewType | undefined;
    const instanceId = (group as any).houseInstanceId as string | undefined;

    if (viewType && this.house.views[viewType]) {
      const instances = this.house.views[viewType];
      
      // Find and remove the specific instance
      const instanceIndex = instanceId 
        ? instances.findIndex((i) => i.instanceId === instanceId)
        : instances.findIndex((i) => i.group === group);
      
      if (instanceIndex !== -1) {
        const instance = instances[instanceIndex];
        console.log(`[HouseManager] Removing view instance: ${viewType}, instanceId: ${instance.instanceId}, side: ${instance.side}`);

        // Clear side assignment
        if (instance.side) {
          this.house.sideAssignments[instance.side] = null;
          console.log(`[HouseManager] Cleared side assignment for ${instance.side}`);
        }
        
        // Remove from array
        instances.splice(instanceIndex, 1);
        console.log(`[HouseManager] View ${viewType} instance removed, remaining: ${instances.length}`);
        this.notify();
        return;
      }
    }

    // Fallback: search by group reference across all view types
    for (const vt of Object.keys(this.house.views) as ViewType[]) {
      const instances = this.house.views[vt];
      const instanceIndex = instances.findIndex((i) => i.group === group);
      
      if (instanceIndex !== -1) {
        const instance = instances[instanceIndex];
        console.log(`[HouseManager] Removing view by reference: ${vt}, side: ${instance.side}`);
        if (instance.side) {
          this.house.sideAssignments[instance.side] = null;
        }
        instances.splice(instanceIndex, 1);
        console.log(`[HouseManager] View ${vt} removed, remaining: ${instances.length}`);
        this.notify();
        break;
      }
    }
  }

  // Remove all instances of a view type (alternative method)
  removeViewByType(viewType: ViewType): void {
    if (!this.house) return;

    const instances = this.house.views[viewType];
    if (instances && instances.length > 0) {
      console.log(`[HouseManager] Removing all ${instances.length} instances of view type: ${viewType}`);
      
      // Clear all side assignments for these instances
      for (const instance of instances) {
        if (instance.side) {
          this.house.sideAssignments[instance.side] = null;
        }
      }
      
      // Clear the array
      this.house.views[viewType] = [];
      this.notify();
    }
  }

  // Apply current piloti data to a group (when creating a new view)
  private applyPilotiDataToGroup(group: Group): void {
    if (!this.house) return;

    const objects = group.getObjects();

    // First pass: set data properties (height/master/nivel) and resize rects
    objects.forEach((obj: FabricObject) => {
      const pilotiId = (obj as any).pilotiId;
      if (!pilotiId) return;

      const data = this.house!.pilotis[pilotiId];
      if (!data) return;

      if ((obj as any).isPilotiCircle || (obj as any).isPilotiRect) {
        (obj as any).pilotiHeight = data.height;
        (obj as any).pilotiIsMaster = data.isMaster;
        (obj as any).pilotiNivel = data.nivel;

        // Update visual style for master
        if (data.isMaster) {
          obj.set('fill', MASTER_PILOTI_FILL);
          obj.set('stroke', MASTER_PILOTI_STROKE);
          obj.set('strokeWidth', (obj as any).isPilotiRect ? 3 : 2);
        }

        // For rect pilotis in front/back/side views, update the visual height
        if ((obj as any).isPilotiRect) {
          const baseHeight = (obj as any).pilotiBaseHeight || 60;
          const newVisualHeight = baseHeight * data.height;
          obj.set({ height: newVisualHeight, scaleY: 1 });
          obj.setCoords();
          (obj as any).dirty = true;
        }
      }

      if ((obj as any).isPilotiText) {
        (obj as any).set('text', formatPilotiHeight(data.height));
      }

      if ((obj as any).isPilotiNivelText) {
        const isCorner = CORNER_PILOTI_IDS.includes(pilotiId);
        if (isCorner) {
          (obj as any).set('text', `Nível = ${formatPilotiHeight(data.nivel)}`);
          (obj as any).set('visible', true);
        } else {
          (obj as any).set('text', '');
          (obj as any).set('visible', false);
        }
      }

      if ((obj as any).isPilotiSizeLabel) {
        (obj as any).set('text', formatPilotiHeight(data.height));
      }
    });

    // Second pass: AFTER rects are resized, position size labels using the final rect height.
    objects.forEach((obj: FabricObject) => {
      if (!(obj as any).isPilotiSizeLabel) return;

      const pilotiId = (obj as any).pilotiId;
      if (!pilotiId) return;

      const rect = objects.find(
        (o: any) => o.pilotiId === pilotiId && o.isPilotiRect,
      ) as any;
      if (!rect) return;

      const baseHeight = (rect as any).pilotiBaseHeight || 60;
      const s = baseHeight / BASE_PILOTI_HEIGHT_PX;
      const offset = 8 * s;

      const rectWidth = (rect.width ?? 0) as number;
      const rectHeight = (rect.height ?? 0) as number;

      (obj as any).set('left', (rect.left ?? 0) + rectWidth / 2);
      (obj as any).set('top', (rect.top ?? 0) + rectHeight + offset);
      (obj as any).setCoords?.();
      (obj as any).dirty = true;
    });

    // Update ground line in elevation views
    updateGroundInGroup(group);
    refreshHouseGroupRendering(group);
  }

  // Update piloti data and sync across all views
  updatePiloti(pilotiId: string, data: Partial<PilotiData>): void {
    if (!this.house) return;

    // Enforce "single master" globally: when setting a master, clear previous masters
    const clearedMasters: string[] = [];
    if (data.isMaster === true) {
      Object.entries(this.house.pilotis).forEach(([id, p]) => {
        if (id !== pilotiId && p.isMaster) {
          this.house!.pilotis[id] = { ...p, isMaster: false };
          clearedMasters.push(id);
        }
      });
    }

    // Update central store
    const current = this.house.pilotis[pilotiId] || { ...DEFAULT_PILOTI };
    this.house.pilotis[pilotiId] = { ...current, ...data };

    // Sync to all views (now iterating over arrays of instances)
    Object.values(this.house.views).forEach((instances) => {
      if (!instances || instances.length === 0) return;

      for (const instance of instances) {
        const group = instance.group;

        // First: if we cleared any previous masters, update them in this group
        if (clearedMasters.length) {
          clearedMasters.forEach((id) => {
            const p = this.house!.pilotis[id];
            updatePilotiMaster(group, id, p.isMaster, p.nivel);
          });
        }

        // Then update the target piloti
        const newData = this.house!.pilotis[pilotiId];
        if (data.height !== undefined) {
          updatePilotiHeight(group, pilotiId, newData.height);
        }
        if (data.isMaster !== undefined || data.nivel !== undefined) {
          updatePilotiMaster(group, pilotiId, newData.isMaster, newData.nivel);
        }
        // Update ground line when nivel changes for a corner piloti
        if (data.nivel !== undefined && CORNER_PILOTI_IDS.includes(pilotiId)) {
          updateGroundInGroup(group);
        }
      }
    });

    this.canvas?.requestRenderAll();
    this.notify();
  }

  // Get piloti data
  getPilotiData(pilotiId: string): PilotiData {
    return this.house?.pilotis[pilotiId] || { ...DEFAULT_PILOTI };
  }

  // Check if any views exist
  hasAnyView(): boolean {
    if (!this.house) return false;
    return Object.values(this.house.views).some((instances) => instances && instances.length > 0);
  }

  // Get all registered groups
  getAllGroups(): Group[] {
    if (!this.house) return [];
    const groups: Group[] = [];
    for (const instances of Object.values(this.house.views)) {
      if (instances) {
        for (const instance of instances) {
          groups.push(instance.group);
        }
      }
    }
    return groups;
  }

  // Get all house elements (windows/doors)
  getElements(): HouseElement[] {
    return this.house?.elements || [];
  }

  // Add an element (window/door)
  addElement(element: Omit<HouseElement, 'id'>): void {
    if (!this.house) return;
    const newElement: HouseElement = {
      ...element,
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    this.house.elements.push(newElement);
    this.notify();
  }

  // Remove an element by id
  removeElement(elementId: string): void {
    if (!this.house) return;
    this.house.elements = this.house.elements.filter((e) => e.id !== elementId);
    this.notify();
  }

  // Update an element
  updateElement(elementId: string, updates: Partial<Omit<HouseElement, 'id'>>): void {
    if (!this.house) return;
    const element = this.house.elements.find((e) => e.id === elementId);
    if (element) {
      Object.assign(element, updates);
      this.notify();
    }
  }

  // Initialize default elements based on house type
  // Uses absolute pixel dimensions matching the 2D canvas scale
  // House body dimensions at SCALE=0.6: width=366px, height=132px
  initializeDefaultElements(): void {
    if (!this.house?.houseType) return;
    
    // Clear existing elements
    this.house.elements = [];
    
    // Add default elements based on house type
    // All positions/sizes in pixels (will be scaled in 3D viewer)
    if (this.house.houseType === 'tipo6') {
      // Front face: 1 door + 2 windows
      // Door: 60×110 px, centered-right
      this.addElement({
        type: 'door',
        face: 'front',
        x: 220, // X position in pixels from left
        y: 22,  // Y position from top of body
        width: 60,
        height: 110,
      });
      // Window 1: 55×45 px, left side
      this.addElement({
        type: 'window',
        face: 'front',
        x: 40,
        y: 30,
        width: 55,
        height: 45,
      });
      // Window 2: 55×45 px, right side
      this.addElement({
        type: 'window',
        face: 'front',
        x: 130,
        y: 30,
        width: 55,
        height: 45,
      });
      // Back face: 2 windows
      this.addElement({
        type: 'window',
        face: 'back',
        x: 50,
        y: 30,
        width: 55,
        height: 45,
      });
      this.addElement({
        type: 'window',
        face: 'back',
        x: 200,
        y: 30,
        width: 55,
        height: 45,
      });
    } else if (this.house.houseType === 'tipo3') {
      // Lateral views (long sides = front/back in 3D)
      this.addElement({
        type: 'window',
        face: 'front',
        x: 140,
        y: 30,
        width: 70,
        height: 50,
      });
      this.addElement({
        type: 'window',
        face: 'back',
        x: 140,
        y: 30,
        width: 70,
        height: 50,
      });
      // Quadrado Aberto (right side in 3D - has door + window)
      this.addElement({
        type: 'door',
        face: 'right',
        x: 96,
        y: 24,
        width: 60,
        height: 108,
      });
      this.addElement({
        type: 'window',
        face: 'right',
        x: 21,
        y: 24,
        width: 54,
        height: 45,
      });
    }
  }

  // Auto-assign all sides based on initial view positioning
  autoAssignAllSides(initialViewType: ViewType, initialSide: HouseSide): void {
    if (!this.house?.houseType) return;

    const slots: Record<string, HouseSide> = {};

    if (this.house.houseType === 'tipo6') {
      const oppositeSide = OPPOSITE_SIDE[initialSide];
      slots['front'] = initialSide;
      slots['back'] = oppositeSide;

      if (initialSide === 'top') {
        slots['side1_0'] = 'right';
        slots['side1_1'] = 'left';
      } else {
        slots['side1_0'] = 'left';
        slots['side1_1'] = 'right';
      }
    } else if (this.house.houseType === 'tipo3') {
      const oppositeSide = OPPOSITE_SIDE[initialSide];
      slots['side2'] = initialSide;
      slots['side1'] = oppositeSide;

      slots['back_0'] = 'top';
      slots['back_1'] = 'bottom';
    }

    this.house.preAssignedSlots = slots;
    console.log('[HouseManager] Auto-assigned slots:', slots);
    this.notify();
  }

  // Get pre-assigned slots for a view type
  getPreAssignedSlots(viewType: ViewType): { label: string; side: HouseSide; onCanvas: boolean }[] {
    if (!this.house?.preAssignedSlots) return [];

    const result: { label: string; side: HouseSide; onCanvas: boolean }[] = [];

    for (const [key, side] of Object.entries(this.house.preAssignedSlots)) {
      if (key === viewType || key.startsWith(`${viewType}_`)) {
        const onCanvas = this.house.sideAssignments[side] === viewType;
        result.push({ label: this.getSideLabel(side), side, onCanvas });
      }
    }

    // Sort: left before right, top before bottom
    result.sort((a, b) => {
      const order: Record<string, number> = { left: 0, right: 1, top: 0, bottom: 1 };
      return (order[a.side] ?? 0) - (order[b.side] ?? 0);
    });

    return result;
  }

  // Check if pre-assigned slots exist
  hasPreAssignedSlots(): boolean {
    return this.house ? Object.keys(this.house.preAssignedSlots).length > 0 : false;
  }

  // Get human-readable label for a side
  private getSideLabel(side: HouseSide): string {
    switch (side) {
      case 'top': return 'Superior';
      case 'bottom': return 'Inferior';
      case 'left': return 'Esquerdo';
      case 'right': return 'Direito';
    }
  }
}

// Singleton instance
export const houseManager = new HouseManager();
