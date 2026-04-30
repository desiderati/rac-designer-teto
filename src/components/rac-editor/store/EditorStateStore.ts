import {
  isEditorSelection,
  type EditorSelection,
} from '@/components/rac-editor/@canvas/store/types.ts';
import type {EditorCommand} from './commands/types.ts';

export interface EditorState {
  selection: EditorSelection | null;
}

export type EditorStoreListener = (
  state: EditorState,
  previousState: EditorState,
  command: EditorCommand,
) => void;

function cloneState(state: EditorState): EditorState {
  return {
    selection: state.selection ? JSON.parse(JSON.stringify(state.selection)) as EditorSelection : null,
  };
}

function areStatesEqual(left: EditorState, right: EditorState): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertValidSelection(selection: EditorSelection | null): void {
  if (selection !== null && !isEditorSelection(selection)) {
    throw new Error('Invalid editor selection: selection must be serializable and free of canvas runtime objects.');
  }
}

/**
 * Store serializável do estado de interação do editor.
 *
 * Esta store não substitui ainda o gerenciador principal: ela concentra apenas estado
 * de editor que pode ser expresso sem Fabric, começando pela seleção pública.
 * O objetivo é permitir migração incremental de UI e bindings para commands.
 */
export class EditorStore {
  private state: EditorState;
  private readonly listeners = new Set<EditorStoreListener>();

  constructor(initialState: Partial<EditorState> = {}) {
    this.state = {
      selection: initialState.selection ?? null,
    };
    assertValidSelection(this.state.selection);
  }

  getState(): EditorState {
    return cloneState(this.state);
  }

  /**
   * Aplica um command e retorna se houve mudança observável.
   */
  dispatch(command: EditorCommand): boolean {
    const previousState = cloneState(this.state);

    switch (command.type) {
      case 'SELECT_EDITOR_TARGET':
        assertValidSelection(command.selection);
        this.state = {
          ...this.state,
          selection: command.selection ? cloneState({selection: command.selection}).selection : null,
        };
        break;

      case 'CLEAR_EDITOR_SELECTION':
        this.state = {
          ...this.state,
          selection: null,
        };
        break;
    }

    if (areStatesEqual(previousState, this.state)) {
      return false;
    }

    const nextState = cloneState(this.state);
    this.listeners.forEach((listener) => listener(nextState, previousState, command));
    return true;
  }

  subscribe(listener: EditorStoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  destroy(): void {
    this.listeners.clear();
  }
}
