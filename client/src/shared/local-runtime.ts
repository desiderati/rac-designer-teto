/** Ambos dispensam a base remota de Construções; só isolated desliga todas as integrações. */
export const isLocalEditorMode = import.meta.env.MODE === 'isolated' || import.meta.env.VITE_E2E === 'true';

export const isIsolatedLocalMode = import.meta.env.MODE === 'isolated';
