import type { LicenceCode, Track } from './types';

export interface LicenceInfo {
  code: LicenceCode; name: string; url: string;
  commercial: boolean; derivatives: boolean;
  kind: 'ok' | 'nc' | 'nd';
  label: string;      // the badge
  explain: string;    // one plain line
}

export const licences: Record<LicenceCode, LicenceInfo> = {
  'CC-BY': { code: 'CC-BY', name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/', commercial: true, derivatives: true, kind: 'ok',
    label: 'Apta para monetizar', explain: 'Puedes usarla en vídeos monetizados. Da crédito al artista.' },
  'CC-BY-SA': { code: 'CC-BY-SA', name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/', commercial: true, derivatives: true, kind: 'ok',
    label: 'Apta para monetizar', explain: 'Puedes usarla en vídeos monetizados. Da crédito y, si la modificas, compártela con la misma licencia.' },
  'CC-BY-NC': { code: 'CC-BY-NC', name: 'CC BY-NC 4.0', url: 'https://creativecommons.org/licenses/by-nc/4.0/', commercial: false, derivatives: true, kind: 'nc',
    label: 'Solo uso no comercial', explain: 'No la uses en vídeos monetizados ni en publicidad.' },
  'CC-BY-ND': { code: 'CC-BY-ND', name: 'CC BY-ND 4.0', url: 'https://creativecommons.org/licenses/by-nd/4.0/', commercial: true, derivatives: false, kind: 'nd',
    label: 'Sin modificaciones', explain: 'Uso comercial permitido, pero sin recortarla ni mezclarla. Revisa si tu vídeo cuenta como modificación.' },
};

export const isMonetizable = (t: Track) => licences[t.licence].kind === 'ok';

export function creditText(t: Track, artistName: string): string {
  const l = licences[t.licence];
  return `Música: "${t.title}" de ${artistName}, con licencia ${l.name} (${l.url}). Encontrada en Clipsong.`;
}
