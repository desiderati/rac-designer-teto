import {COOKIE_NAME} from '@shared/const';

/** Mesmo transporte da API quando o iframe não aceita cookies. */
export function getSessionHeaders(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem('manus-cookie');
    const prefix = `${COOKIE_NAME}=`;
    const token = raw?.split(';').find((entry) => entry.trim().startsWith(prefix))?.trim().slice(prefix.length);
    return token ? {Authorization: `Bearer ${token}`} : {};
  } catch {
    return {};
  }
}
