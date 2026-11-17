import type { LicenceCode, Track } from './types.ts';

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
  'CC-BY-NC-SA': { code: 'CC-BY-NC-SA', name: 'CC BY-NC-SA', url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/', commercial: false, derivatives: true, kind: 'nc',
    label: 'Solo uso no comercial', explain: 'No la uses en vídeos monetizados ni en publicidad.' },
  'CC-BY-NC-ND': { code: 'CC-BY-NC-ND', name: 'CC BY-NC-ND', url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/', commercial: false, derivatives: false, kind: 'nc',
    label: 'Solo uso no comercial', explain: 'No la uses en vídeos monetizados ni la modifiques.' },
  'CC-BY-ND': { code: 'CC-BY-ND', name: 'CC BY-ND 4.0', url: 'https://creativecommons.org/licenses/by-nd/4.0/', commercial: true, derivatives: false, kind: 'nd',
    label: 'Sin modificaciones', explain: 'Uso comercial permitido, pero sin recortarla ni mezclarla. Revisa si tu vídeo cuenta como modificación.' },
};

export const isMonetizable = (t: Track) => licences[t.licence].kind === 'ok';

/** Licence name with the real version, e.g. "CC BY-SA 3.0", from the track's own licence URL. */
export function licenceName(t: Track): string {
  const v = t.licenceUrl?.match(/\/(\d\.\d)\/?$/)?.[1];
  const base = licences[t.licence].name.replace(/ \d\.\d$/, '');
  return v ? `${base} ${v}` : licences[t.licence].name;
}
export const licenceUrl = (t: Track) => t.licenceUrl ?? licences[t.licence].url;

export function creditText(t: Track, artistName: string): string {
  return `Música: "${t.title}" de ${artistName}, con licencia ${licenceName(t)} (${licenceUrl(t)}). Encontrada en Clipsong.`;
}

/** Map a Creative Commons URL (as Jamendo returns it) to our code. null = not CC, do not import. */
export function licenceFromUrl(url: string | undefined | null): LicenceCode | null {
  const m = url?.match(/creativecommons\.org\/licenses\/([a-z-]+)\//i);
  if (!m) return null;
  const map: Record<string, LicenceCode> = { by: 'CC-BY', 'by-sa': 'CC-BY-SA', 'by-nc': 'CC-BY-NC', 'by-nd': 'CC-BY-ND', 'by-nc-sa': 'CC-BY-NC-SA', 'by-nc-nd': 'CC-BY-NC-ND' };
  return map[m[1].toLowerCase()] ?? null;
}
