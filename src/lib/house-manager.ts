import { Group, FabricObject, Canvas as FabricCanvas } from 'fabric';
import {
  updatePilotiHeight,
  updatePilotiMaster,
  refreshHouseGroupRendering,
  formatPilotiHeight,
  MASTER_PILOTI_FILL,
  MASTER_PILOTI_STROKE,
} from './canvas-utils';

// Types for house sides
export type HouseSide = 'top' | 'bottom' | 'left' | 'right';
export type ViewType = 'top' | 'front' | 'back' | 'side1' | 'side2';

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

// House state
export interface HouseState {
  id: string;
  pilotis: Record<string, PilotiData>; // pilotiId -> data
  views: Record<ViewType, { group: Group; side?: HouseSide } | null>;
  sideAssignments: Record<HouseSide, ViewType | null>;
}

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
      pilotis,
      views: {
        top: null,
        front: null,
        back: null,
        side1: null,
        side2: null,
      },
      sideAssignments: {
        top: null,
        bottom: null,
        left: null,
        right: null,
      },
    };
  }

  getHouse(): HouseState | null {
    return this.house;
  }

  hasView(viewType: ViewType): boolean {
    // When house isn't initialized yet, no views exist.
    if (!this.house) return false;
    return this.house.views[viewType] !== null;
  }

  getAvailableViews(): ViewType[] {
    if (!this.house) return [];
    return (['top', 'front', 'back', 'side1', 'side2'] as ViewType[]).filter(
      (v) => !this.house!.views[v]
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
      // Side is available if not assigned, or if assigned to the opposite view
      return assignment === null;
    });
  }

  // Check if user needs to select a side for this view
  needsSideSelection(viewType: ViewType): boolean {
    if (viewType === 'top') return false; // Top view doesn't need side selection
    
    const availableSides = this.getAvailableSides(viewType);
    if (availableSides.length === 0) return false; // No sides available
    if (availableSides.length === 1) return false; // Only one option, auto-select
    
    // Check if the opposite view already has a side assigned
    const oppositeView = OPPOSITE_VIEW[viewType];
    if (oppositeView && this.house?.views[oppositeView]) {
      // Opposite view exists, so we know which side this should go
      return false;
    }
    
    return true; // User needs to choose
  }

  // Get the auto-selected side if only one is available or opposite is assigned
  getAutoSelectedSide(viewType: ViewType): HouseSide | null {
    if (viewType === 'top') return null;
    
    const availableSides = this.getAvailableSides(viewType);
    if (availableSides.length === 1) return availableSides[0];
    
    // Check if opposite view has a side, then use the opposite side
    const oppositeView = OPPOSITE_VIEW[viewType];
    if (oppositeView && this.house?.views[oppositeView]) {
      const oppositeViewData = this.house.views[oppositeView];
      if (oppositeViewData?.side) {
        return OPPOSITE_SIDE[oppositeViewData.side];
      }
    }
    
    return null;
  }

  // Register a view with its group and side
  registerView(viewType: ViewType, group: Group, side?: HouseSide): void {
    if (!this.house) return;

    // Mark the group with its view type for later identification
    (group as any).houseViewType = viewType;

    // Apply current piloti data to the new group
    this.applyPilotiDataToGroup(group);

    this.house.views[viewType] = { group, side };
    
    if (side) {
      this.house.sideAssignments[side] = viewType;
    }
    
    console.log(`[HouseManager] Registered view ${viewType}, side: ${side}`);
  }

  // Remove a view (when deleted from canvas)
  removeView(group: Group): void {
    if (!this.house) return;

    // First try to identify by the houseViewType property we set during registration
    const viewType = (group as any).houseViewType as ViewType | undefined;
    
    if (viewType && this.house.views[viewType]) {
      const viewData = this.house.views[viewType];
      console.log(`[HouseManager] Removing view by houseViewType: ${viewType}, side: ${viewData?.side}`);
      
      // Clear side assignment
      if (viewData?.side) {
        this.house.sideAssignments[viewData.side] = null;
        console.log(`[HouseManager] Cleared side assignment for ${viewData.side}`);
      }
      this.house.views[viewType] = null;
      console.log(`[HouseManager] View ${viewType} removed, available views:`, this.getAvailableViews());
      return;
    }

    // Fallback: search by group reference (for backwards compatibility)
    for (const vt of Object.keys(this.house.views) as ViewType[]) {
      const viewData = this.house.views[vt];
      if (viewData?.group === group) {
        console.log(`[HouseManager] Removing view by reference: ${vt}, side: ${viewData.side}`);
        if (viewData.side) {
          this.house.sideAssignments[viewData.side] = null;
        }
        this.house.views[vt] = null;
        console.log(`[HouseManager] View ${vt} removed, available views:`, this.getAvailableViews());
        break;
      }
    }
  }

  // Remove view by type (alternative method)
  removeViewByType(viewType: ViewType): void {
    if (!this.house) return;
    
    const viewData = this.house.views[viewType];
    if (viewData) {
      console.log(`[HouseManager] Removing view by type: ${viewType}`);
      if (viewData.side) {
        this.house.sideAssignments[viewData.side] = null;
      }
      this.house.views[viewType] = null;
    }
  }

  // Apply current piloti data to a group (when creating a new view)
  private applyPilotiDataToGroup(group: Group): void {
    if (!this.house) return;

    const objects = group.getObjects();
    
    // First pass: set data properties
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
        if ((obj as any).isPilotiRect && data.height !== 1.0) {
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

      if ((obj as any).isPilotiNivelText && data.isMaster) {
        (obj as any).set('text', `Nível = ${formatPilotiHeight(data.nivel)}`);
        (obj as any).set('visible', true);
      }
    });

    refreshHouseGroupRendering(group);
  }

  // Update piloti data and sync across all views
  updatePiloti(pilotiId: string, data: Partial<PilotiData>): void {
    if (!this.house) return;

    // Update central store
    const current = this.house.pilotis[pilotiId] || { ...DEFAULT_PILOTI };
    this.house.pilotis[pilotiId] = { ...current, ...data };

    // Sync to all views
    Object.values(this.house.views).forEach((viewData) => {
      if (!viewData?.group) return;

      const group = viewData.group;
      const newData = this.house!.pilotis[pilotiId];

      if (data.height !== undefined) {
        updatePilotiHeight(group, pilotiId, newData.height);
      }
      if (data.isMaster !== undefined || data.nivel !== undefined) {
        updatePilotiMaster(group, pilotiId, newData.isMaster, newData.nivel);
      }
    });

    this.canvas?.requestRenderAll();
  }

  // Get piloti data
  getPilotiData(pilotiId: string): PilotiData {
    return this.house?.pilotis[pilotiId] || { ...DEFAULT_PILOTI };
  }

  // Check if any views exist
  hasAnyView(): boolean {
    if (!this.house) return false;
    return Object.values(this.house.views).some((v) => v !== null);
  }

  // Get all registered groups
  getAllGroups(): Group[] {
    if (!this.house) return [];
    return Object.values(this.house.views)
      .filter((v) => v !== null)
      .map((v) => v!.group);
  }
}

// Singleton instance
export const houseManager = new HouseManager();
