import {useEffect, useRef, useState} from 'react';

/**
 * Controla um "rascunho" (draft) para formulários de edição.
 *
 * O que é draft?
 * Draft é uma cópia temporária dos dados que o usuário está editando.
 * Pense como um rascunho: você pode mudar à vontade sem gravar de verdade.
 *
 * Fluxo comum:
 * 1. Editor abre: o draft começa com 'initialDraft'.
 * 2. Usuário altera campos: apenas o draft é alterado.
 * 3. Cancelar: chama 'resetDraft()' e volta para o valor inicial mais recente.
 * 4. Confirmar: quem usa o hook salva o draft no estado real da aplicação.
 *
 * Comportamento importante:
 * Quando o editor fecha e abre novamente, o hook recarrega o draft com o
 * 'initialDraft' mais atual (evita exibir dados antigos na reabertura).
 *
 * @template TDraft Tipo dos dados que serão editados no rascunho.
 * @param {TDraft} initialDraft Valor inicial/base do rascunho.
 * @param {boolean} isOpen Indica se o editor está aberto.
 * @returns {{
 *   draft: TDraft;
 *   setDraft: (value: TDraft | ((current: TDraft) => TDraft)) => void;
 *   resetDraft: () => void;
 * }} Objeto com o rascunho atual, função para editar e função para reiniciar.
 */
export function useGenericObjectEditorDraft<TDraft>(initialDraft: TDraft, isOpen: boolean): {
  draft: TDraft;
  setDraft: (value: TDraft | ((current: TDraft) => TDraft)) => void;
  resetDraft: () => void;
} {
  const [draft, setDraft] = useState(initialDraft);
  const latestInitialDraftRef = useRef(initialDraft);
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    latestInitialDraftRef.current = initialDraft;
  }, [initialDraft]);

  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    if (justOpened) {
      setDraft(latestInitialDraftRef.current);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const resetDraft = () => {
    setDraft(latestInitialDraftRef.current);
  };

  return {
    draft,
    setDraft,
    resetDraft,
  };
}
