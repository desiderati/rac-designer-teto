import {getAllPilotiIds} from '@/shared/types/piloti.ts';
export const definedPilotis = () => Object.fromEntries(getAllPilotiIds().map((id, index) => [id, {height: 1.5, nivel: .2, isMaster: index === 0}]));
