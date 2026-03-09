import {useEffect, useMemo, useState} from 'react';
import {CanvasGroup, getPilotiFromGroup, getPilotiIdsFromGroup,} from '@/components/rac-editor/lib/canvas';
import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import {getSettings} from '@/infra/settings.ts';
import {PILOTI_CORNER_IDS, TIMINGS} from '@/shared/config.ts';
import {
  clampNivelByHeight,
  getAllPilotiIds,
  getPilotiName,
  getRecommendedHeight,
  MAX_AVAILABLE_PILOTI_NIVEL,
} from '@/shared/types/piloti.ts';

interface UsePilotiEditorArgs {
  isOpen: boolean;
  onClose: () => void;
  pilotiId: string | null;
  currentHeight: number;
  currentIsMaster: boolean;
  currentNivel: number;
  group: CanvasGroup | null;
  onHeightChange: (newHeight: number) => void;
  onNavigate?: (pilotiId: string, height: number, isMaster: boolean, nivel: number) => void;
}

export function usePilotiEditor({
  isOpen,
  onClose,
  pilotiId,
  currentHeight,
  currentIsMaster,
  currentNivel,
  group,
  onHeightChange,
  onNavigate,
}: UsePilotiEditorArgs) {

  const [tempHeight, setTempHeight] = useState(() => currentHeight);
  const [tempIsMaster, setTempIsMaster] = useState(() => currentIsMaster);
  const [tempNivel, setTempNivel] = useState(() => currentNivel);
  const [clickedHeight, setClickedHeight] = useState<number | null>(null);


  const allIds = useMemo(() => {
    if (group) return getPilotiIdsFromGroup(group);
    return getAllPilotiIds();
  }, [group]);

  const currentIndex = pilotiId ? allIds.indexOf(pilotiId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allIds.length - 1 && currentIndex >= 0;
  const pilotiName = pilotiId ? getPilotiName(pilotiId) : '';
  const isCornerPiloti = pilotiId ? PILOTI_CORNER_IDS.includes(pilotiId) : false;

  const masterPilotiName = useMemo(() => {
    if (!group) return undefined;

    for (const id of allIds) {
      const data = getPilotiFromGroup(group, id);
      if (data?.isMaster) return getPilotiName(id);
    }

    if (tempIsMaster && pilotiId) return getPilotiName(pilotiId);
    return undefined;
  }, [group, allIds, tempIsMaster, pilotiId]);

  useEffect(() => {
    if (!isOpen) return;

    setTempHeight(currentHeight);
    setTempIsMaster(currentIsMaster);
    setTempNivel(currentNivel);
  }, [isOpen, pilotiId, currentHeight, currentIsMaster, currentNivel]);

  // Clipa o nível apenas quando a altura muda (botão de altura), nunca durante o drag.
  // Usa atualização funcional para ler o valor mais recente sem precisar de tempNivel nas deps.
  useEffect(() => {
    setTempNivel(prev => {
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

    if (!group) return;
    const pilotiData = getPilotiFromGroup(group, newId);
    if (pilotiData && onNavigate) {
      onNavigate(newId, pilotiData.height, pilotiData.isMaster, pilotiData.nivel);
      setTempHeight(pilotiData.height);
      setTempIsMaster(pilotiData.isMaster);
      setTempNivel(pilotiData.nivel);
    }
  };

  const handleApply = () => {
    commitDraftChanges();
    onClose();
  };

  const handleCancel = () => {
    setTempHeight(currentHeight);
    setTempIsMaster(currentIsMaster);
    setTempNivel(currentNivel);
    onClose();
  };

  // Sem clamp por altura durante o drag — o slider já limita ao máximo global.
  // A limitação pela altura do piloti só ocorre no commit (handleNivelCommit / commitDraftChanges).
  const handleNivelChange = (value: number) => {
    setTempNivel(value);
  };

  const handleNivelCommit = (value: number) => {
    if (!pilotiId) return;

    // Regra: ao soltar o drag do slider, a altura é sempre recalculada com base no nível escolhido.
    const recommendedHeight = getRecommendedHeight(value);
    setTempHeight(recommendedHeight);
    setTempNivel(value);

    houseManager.updatePiloti(pilotiId, {
      height: recommendedHeight,
      isMaster: tempIsMaster,
      nivel: value,
    });

    const updatedPiloti = houseManager.getPilotiData(pilotiId);
    onHeightChange(updatedPiloti.height);
    onNavigate?.(pilotiId, updatedPiloti.height, updatedPiloti.isMaster, updatedPiloti.nivel);
  };

  const handleNivelIncrement = (delta: number) => {
    const newVal = Math.round((tempNivel + delta) * 100) / 100;
    handleNivelChange(newVal);
  };

  const handleHeightClick = (h: number) => {
    setTempHeight(h);

    const {autoNavigatePiloti} = getSettings();
    const nivelToApply = clampNivelByHeight(tempNivel, h);

    // Ao reduzir altura, ajusta imediatamente o slider para não ultrapassar o novo máximo.
    setTempNivel(nivelToApply);

    if (pilotiId) {
      houseManager.updatePiloti(pilotiId, {
        height: h,
        isMaster: tempIsMaster,
        nivel: nivelToApply,
      });

      const updatedPiloti = houseManager.getPilotiData(pilotiId);
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

        if (nextId && group) {
          const pilotiData = getPilotiFromGroup(group, nextId);
          if (pilotiData && onNavigate) {
            onNavigate(nextId, pilotiData.height, pilotiData.isMaster, pilotiData.nivel);
            setTempHeight(pilotiData.height);
            setTempIsMaster(pilotiData.isMaster);
            setTempNivel(pilotiData.nivel);
          }
          return;
        }

        onClose();
      }, TIMINGS.pilotiAutoNavigateDelayMs);
    }
  };

  const getHeightButtonClasses = (h: number): string => {
    const isSelected = clickedHeight === h || (clickedHeight === null && tempHeight === h);
    return isSelected
      ? 'bg-primary text-primary-foreground rounded-xl text-lg font-semibold py-3'
      : 'bg-primary/10 text-foreground rounded-xl text-lg font-semibold py-3 hover:bg-primary/20';
  };

  const getContraventamentoButtonClasses =
    (isActive: boolean, isDisabled: boolean): string => {
      if (isDisabled) {
        return 'h-[86px] rounded-xl border border-transparent bg-primary/10 text-muted-foreground opacity-50 cursor-not-allowed';
      }
      return isActive
        ? 'h-[86px] rounded-xl border border-transparent bg-primary text-primary-foreground hover:bg-primary/90'
        : 'h-[86px] rounded-xl border border-transparent bg-primary/10 text-foreground hover:bg-primary/20';
    };

  const commitDraftChanges =
    (params?: { nivelOverride?: number; isMasterOverride?: boolean }): boolean => {
      if (!pilotiId) return false;

      const resolvedNivel =
        Number.isFinite(params?.nivelOverride)
          ? Number(params?.nivelOverride)
          : tempNivel;

      const resolvedIsMaster =
        typeof params?.isMasterOverride === 'boolean'
          ? params.isMasterOverride
          : tempIsMaster;

      const nivelToApply = clampNivelByHeight(resolvedNivel, tempHeight);
      const hasChanges = tempHeight !== currentHeight
        || resolvedIsMaster !== currentIsMaster
        || nivelToApply !== currentNivel;
      if (!hasChanges) return false;

      houseManager.updatePiloti(pilotiId, {
        height: tempHeight,
        isMaster: resolvedIsMaster,
        nivel: nivelToApply,
      });

      const updatedPiloti = houseManager.getPilotiData(pilotiId);
      onHeightChange(updatedPiloti.height);
      onNavigate?.(
        pilotiId,
        updatedPiloti.height,
        updatedPiloti.isMaster,
        updatedPiloti.nivel,
      );
      return true;
    };

  const maxNivel = MAX_AVAILABLE_PILOTI_NIVEL;

  return {
    tempHeight,
    setTempHeight,
    tempIsMaster,
    setTempIsMaster,
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
