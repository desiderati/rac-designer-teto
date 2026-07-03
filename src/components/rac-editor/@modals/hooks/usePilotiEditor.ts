import {useContext, useEffect, useMemo, useRef, useState} from 'react';
import type {Dispatch, SetStateAction} from 'react';
import {EditorPortsContext} from '@/bootstrap/editor-bootstrap.ts';
import {PILOTI_CORNER_IDS, TIMINGS} from '@/shared/config.ts';
import {PILOTI_DEFAULT_NIVEL} from '@/shared/constants.ts';
import type {HousePilotiReadPort, HousePilotiWritePort} from '@/components/rac-editor/ports/HousePilotiPort.ts';
import {
  clampNivelByHeight,
  clampNivel,
  getAllPilotiIds,
  getMaxNivelForPilotiHeight,
  getMaxNivelForAvailableHeights,
  getPilotiName,
  getRecommendedHeight,
} from '@/shared/types/piloti.ts';
import {
  getPilotiContraventamentoButtonClasses,
  getPilotiHeightButtonClasses,
} from '@/components/rac-editor/@modals/lib/piloti-editor-classes.ts';

interface UsePilotiEditorArgs {
  isOpen: boolean;
  onClose: () => void;
  pilotiId: string | null;
  currentHeight: number;
  currentIsMaster: boolean;
  currentNivel: number;
  pilotiIds: readonly string[];
  onHeightChange: (newHeight: number) => void;
  onNavigate?: (pilotiId: string, height: number, isMaster: boolean, nivel: number) => void;
  pilotiReadPort?: HousePilotiReadPort;
  pilotiWritePort?: HousePilotiWritePort;
}

export function usePilotiEditor({
  isOpen,
  onClose,
  pilotiId,
  currentHeight,
  currentIsMaster,
  currentNivel,
  pilotiIds,
  onHeightChange,
  onNavigate,
  pilotiReadPort,
  pilotiWritePort,
}: UsePilotiEditorArgs) {

  const editorPorts = useContext(EditorPortsContext);
  const resolvedPilotiReadPort = pilotiReadPort ?? editorPorts?.houseReadPort;
  const resolvedPilotiWritePort = pilotiWritePort ?? editorPorts?.houseWritePort;
  const resolvedSettingsPort = editorPorts?.settingsPort;
  if (!resolvedPilotiReadPort || !resolvedPilotiWritePort || !resolvedSettingsPort) {
    throw new Error(
      'usePilotiEditor requires HousePilotiReadPort, HousePilotiWritePort, SettingsPort or RacEditorStoreProvider.'
    );
  }

  const [tempHeight, setTempHeight] = useState(() => currentHeight);
  const [tempIsMaster, setTempIsMaster] = useState(() => currentIsMaster);
  const [tempNivel, setTempNivel] = useState(() => currentNivel);
  const [clickedHeight, setClickedHeight] = useState<number | null>(null);
  const [autoAdjustPilotiHeightsFromNivel, setAutoAdjustPilotiHeightsFromNivel] = useState(
    () => resolvedSettingsPort.getSettings().autoAdjustPilotiHeightsFromNivel,
  );
  const tempHeightRef = useRef(tempHeight);
  const tempIsMasterRef = useRef(tempIsMaster);
  const tempNivelRef = useRef(tempNivel);
  const autoAdjustPilotiHeightsFromNivelRef = useRef(autoAdjustPilotiHeightsFromNivel);


  const allIds = useMemo(() => {
    if (pilotiIds.length > 0) return [...pilotiIds];
    return getAllPilotiIds();
  }, [pilotiIds]);

  const selectedHeights = resolvedPilotiReadPort.getSelectedPilotiHeights();
  const selectedHeightsRef = useRef(selectedHeights);
  selectedHeightsRef.current = selectedHeights;
  tempHeightRef.current = tempHeight;
  tempIsMasterRef.current = tempIsMaster;
  tempNivelRef.current = tempNivel;
  autoAdjustPilotiHeightsFromNivelRef.current = autoAdjustPilotiHeightsFromNivel;
  const maxNivel = autoAdjustPilotiHeightsFromNivel
    ? getMaxNivelForAvailableHeights(selectedHeights)
    : getMaxNivelForPilotiHeight(tempHeight);

  const setSyncedTempHeight: Dispatch<SetStateAction<number>> = (value) => {
    setTempHeight((previous) => {
      const next = typeof value === 'function'
        ? (value as (current: number) => number)(previous)
        : value;
      tempHeightRef.current = next;
      return next;
    });
  };

  const setSyncedTempIsMaster: Dispatch<SetStateAction<boolean>> = (value) => {
    setTempIsMaster((previous) => {
      const next = typeof value === 'function'
        ? (value as (current: boolean) => boolean)(previous)
        : value;
      tempIsMasterRef.current = next;
      return next;
    });
  };

  const setSyncedTempNivel: Dispatch<SetStateAction<number>> = (value) => {
    setTempNivel((previous) => {
      const next = typeof value === 'function'
        ? (value as (current: number) => number)(previous)
        : value;
      tempNivelRef.current = next;
      return next;
    });
  };

  const setSyncedAutoAdjustPilotiHeightsFromNivel: Dispatch<SetStateAction<boolean>> = (value) => {
    setAutoAdjustPilotiHeightsFromNivel((previous) => {
      const next = typeof value === 'function'
        ? (value as (current: boolean) => boolean)(previous)
        : value;
      autoAdjustPilotiHeightsFromNivelRef.current = next;
      return next;
    });
  };

  const getMaxNivelForMode =
    (autoMode: boolean, height: number): number =>
      autoMode
        ? getMaxNivelForAvailableHeights(selectedHeightsRef.current)
        : getMaxNivelForPilotiHeight(height);

  const currentIndex = pilotiId ? allIds.indexOf(pilotiId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allIds.length - 1 && currentIndex >= 0;
  const pilotiName = pilotiId ? getPilotiName(pilotiId) : '';
  const isCornerPiloti = pilotiId ? PILOTI_CORNER_IDS.includes(pilotiId) : false;

  const masterPilotiName = useMemo(() => {
    for (const id of allIds) {
      const data = resolvedPilotiReadPort.getPilotiData(id);
      if (data?.isMaster) return getPilotiName(id);
    }

    if (tempIsMaster && pilotiId) return getPilotiName(pilotiId);
    return undefined;
  }, [allIds, resolvedPilotiReadPort, tempIsMaster, pilotiId]);

  useEffect(() => {
    if (!isOpen) return;

    setSyncedTempHeight(currentHeight);
    setSyncedTempIsMaster(currentIsMaster);
    setSyncedTempNivel(currentNivel);
    setSyncedAutoAdjustPilotiHeightsFromNivel(
      resolvedSettingsPort.getSettings().autoAdjustPilotiHeightsFromNivel,
    );
  }, [isOpen, pilotiId, currentHeight, currentIsMaster, currentNivel, resolvedSettingsPort]);

  // Clipa o nível apenas quando a altura muda (botão de altura), nunca durante o drag.
  // Usa atualização funcional para ler o valor mais recente sem precisar de tempNivel nas deps.
  useEffect(() => {
    setSyncedTempNivel(prev => {
      const clamped = clampNivelByHeight(prev, tempHeight);
      return clamped !== prev ? clamped : prev;
    });
  }, [tempHeight]);

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!pilotiId) return;

    const idx = allIds.indexOf(pilotiId);
    if (idx === -1) return;

    const newIndex = direction === 'next' ? idx + 1 : idx - 1;
    const newId = allIds[newIndex];
    if (!newId) return;

    commitDraftChanges();

    const pilotiData = resolvedPilotiReadPort.getPilotiData(newId);
    if (pilotiData && onNavigate) {
      onNavigate(newId, pilotiData.height, pilotiData.isMaster, pilotiData.nivel);
      setSyncedTempHeight(pilotiData.height);
      setSyncedTempIsMaster(pilotiData.isMaster);
      setSyncedTempNivel(pilotiData.nivel);
    }
  };

  const handleApply = () => {
    commitDraftChanges();
    onClose();
  };

  const handleCancel = () => {
    setSyncedTempHeight(currentHeight);
    setSyncedTempIsMaster(currentIsMaster);
    setSyncedTempNivel(currentNivel);
    onClose();
  };

  // Sem clamp por altura durante o drag — o slider já limita ao máximo global.
  // A limitação pela altura do piloti só ocorre no commit (handleNivelCommit / commitDraftChanges).
  const handleNivelChange = (value: number) => {
    setSyncedTempNivel(
      clampNivel(
        value,
        PILOTI_DEFAULT_NIVEL,
        getMaxNivelForMode(
          autoAdjustPilotiHeightsFromNivelRef.current,
          tempHeightRef.current,
        ),
      ),
    );
  };

  const handleNivelCommit = (value: number) => {
    if (!pilotiId) return;

    const autoMode = autoAdjustPilotiHeightsFromNivelRef.current;
    const height = tempHeightRef.current;
    const nivelToApply = autoMode
      ? clampNivel(value, PILOTI_DEFAULT_NIVEL, getMaxNivelForMode(autoMode, height))
      : clampNivelByHeight(value, height);
    const heightToApply = autoMode
      ? getRecommendedHeight(nivelToApply, selectedHeightsRef.current)
      : height;
    setSyncedTempHeight(heightToApply);
    setSyncedTempNivel(nivelToApply);

    const updatedPiloti = resolvedPilotiWritePort.updatePiloti(pilotiId, {
      height: heightToApply,
      isMaster: tempIsMasterRef.current,
      nivel: nivelToApply,
    });
    onHeightChange(updatedPiloti.height);
    onNavigate?.(pilotiId, updatedPiloti.height, updatedPiloti.isMaster, updatedPiloti.nivel);
  };

  const handleNivelIncrement = (delta: number) => {
    const newVal = Math.round((tempNivelRef.current + delta) * 100) / 100;
    const clamped = Math.max(
      PILOTI_DEFAULT_NIVEL,
      Math.min(
        newVal,
        getMaxNivelForMode(
          autoAdjustPilotiHeightsFromNivelRef.current,
          tempHeightRef.current,
        ),
      ),
    );
    handleNivelCommit(clamped);
  };

  const handleHeightClick = (h: number) => {
    setSyncedTempHeight(h);

    const {autoNavigatePiloti} = resolvedSettingsPort.getSettings();
    const nivelToApply = clampNivelByHeight(tempNivelRef.current, h);

    // Ao reduzir altura, ajusta imediatamente o slider para não ultrapassar o novo máximo.
    setSyncedTempNivel(nivelToApply);

    if (pilotiId) {
      const updatedPiloti = resolvedPilotiWritePort.updatePiloti(pilotiId, {
        height: h,
        isMaster: tempIsMasterRef.current,
        nivel: nivelToApply,
      });
      onHeightChange(updatedPiloti.height);
      onNavigate?.(
        pilotiId,
        updatedPiloti.height,
        updatedPiloti.isMaster,
        updatedPiloti.nivel,
      );
    }

    if (autoNavigatePiloti && pilotiId) {
      setClickedHeight(h);

      const idx = allIds.indexOf(pilotiId);
      const nextId = idx >= 0 && idx < allIds.length - 1 ? allIds[idx + 1] : null;

      setTimeout(() => {
        setClickedHeight(null);

        if (nextId) {
          const pilotiData = resolvedPilotiReadPort.getPilotiData(nextId);
          if (pilotiData && onNavigate) {
            onNavigate(nextId, pilotiData.height, pilotiData.isMaster, pilotiData.nivel);
            setSyncedTempHeight(pilotiData.height);
            setSyncedTempIsMaster(pilotiData.isMaster);
            setSyncedTempNivel(pilotiData.nivel);
          }
          return;
        }

        onClose();
      }, TIMINGS.pilotiAutoNavigateDelayMs);
    }
  };

  const getHeightButtonClasses = (h: number, options?: { compact?: boolean }): string => {
    return getPilotiHeightButtonClasses({
      height: h,
      clickedHeight,
      tempHeight,
      compact: options?.compact,
    });
  };

  const getContraventamentoButtonClasses =
    (isActive: boolean, isDisabled: boolean): string => {
      return getPilotiContraventamentoButtonClasses(isActive, isDisabled);
    };

  const commitDraftChanges =
    (params?: { nivelOverride?: number; isMasterOverride?: boolean }): boolean => {
      if (!pilotiId) return false;

      const resolvedNivel =
        Number.isFinite(params?.nivelOverride)
          ? Number(params?.nivelOverride)
          : tempNivelRef.current;

      const resolvedIsMaster =
        typeof params?.isMasterOverride === 'boolean'
          ? params.isMasterOverride
          : tempIsMasterRef.current;

      const autoMode = autoAdjustPilotiHeightsFromNivelRef.current;
      const height = tempHeightRef.current;
      const nivelToApply = autoMode
        ? clampNivel(resolvedNivel, PILOTI_DEFAULT_NIVEL, getMaxNivelForMode(autoMode, height))
        : clampNivelByHeight(resolvedNivel, height);
      const heightToApply = autoMode
        ? getRecommendedHeight(nivelToApply, selectedHeightsRef.current)
        : height;
      const hasChanges = heightToApply !== currentHeight
        || resolvedIsMaster !== currentIsMaster
        || nivelToApply !== currentNivel;
      if (!hasChanges) return false;

      const updatedPiloti = resolvedPilotiWritePort.updatePiloti(pilotiId, {
        height: heightToApply,
        isMaster: resolvedIsMaster,
        nivel: nivelToApply,
      });
      onHeightChange(updatedPiloti.height);
      onNavigate?.(
        pilotiId,
        updatedPiloti.height,
        updatedPiloti.isMaster,
        updatedPiloti.nivel,
      );
      return true;
    };

  const handleNivelModeToggle = () => {
    const nextAutoMode = !autoAdjustPilotiHeightsFromNivelRef.current;
    const nextMaxNivel = getMaxNivelForMode(nextAutoMode, tempHeightRef.current);
    const nextNivel = nextAutoMode
      ? clampNivel(tempNivelRef.current, PILOTI_DEFAULT_NIVEL, nextMaxNivel)
      : clampNivelByHeight(tempNivelRef.current, tempHeightRef.current);

    resolvedSettingsPort.updateSetting('autoAdjustPilotiHeightsFromNivel', nextAutoMode);
    setSyncedAutoAdjustPilotiHeightsFromNivel(nextAutoMode);
    setSyncedTempNivel(nextNivel);
    editorPorts?.houseWritePort.refreshElevationNivelLabelsForCurrentSettings?.();
  };

  return {
    tempHeight,
    setTempHeight: setSyncedTempHeight,
    tempIsMaster,
    setTempIsMaster: setSyncedTempIsMaster,
    tempNivel,
    clickedHeight,
    allIds,
    currentIndex,
    hasPrev,
    hasNext,
    pilotiName,
    isCornerPiloti,
    masterPilotiName,
    maxNivel,
    autoAdjustPilotiHeightsFromNivel,
    handleNivelModeToggle,
    handleNavigate,
    handleApply,
    handleCancel,
    handleNivelChange,
    handleNivelCommit,
    handleNivelIncrement,
    handleHeightClick,
    commitDraftChanges,
    getHeightButtonClasses,
    getContraventamentoButtonClasses,
  };
}
