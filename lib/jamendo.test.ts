import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapJamendo } from './jamendo.ts';
import { licenceFromUrl, creditText, licenceName } from './licence.ts';

test('licence URLs map to codes; non-CC is rejected', () => {
  assert.equal(licenceFromUrl('http://creativecommons.org/licenses/by-nc-sa/3.0/'), 'CC-BY-NC-SA');
  assert.equal(licenceFromUrl('https://creativecommons.org/licenses/by/4.0/'), 'CC-BY');
  assert.equal(licenceFromUrl('https://example.com/all-rights-reserved'), null);
  assert.equal(licenceFromUrl(undefined), null);
});

test('maps Jamendo tracks, dedupes artists and albums, skips unusable rows', () => {
  const base = { artist_id: '9', artist_name: 'Ejemplo', album_id: '77', album_name: 'Disco', audio: 'https://mp3l.jamendo.com/x', musicinfo: { tags: { genres: ['lounge'], vartags: ['calm'] } } };
  const r = mapJamendo([
    { ...base, id: '1', name: 'Uno', duration: 120, license_ccurl: 'http://creativecommons.org/licenses/by-sa/3.0/' },
    { ...base, id: '2', name: 'Dos', duration: 90, license_ccurl: 'http://creativecommons.org/licenses/by/3.0/' },
    { ...base, id: '3', name: 'Sin licencia', duration: 90, license_ccurl: '' },
    { ...base, id: '4', name: 'Sin audio', duration: 90, audio: '', license_ccurl: 'http://creativecommons.org/licenses/by/3.0/' },
  ]);
  assert.equal(r.tracks.length, 2); assert.equal(r.skipped, 2);
  assert.equal(r.artists.length, 1); assert.equal(r.albums.length, 1);
  const t = r.tracks[0];
  assert.equal(t.id, 'jm-1'); assert.equal(t.durationMs, 120000); assert.deepEqual(t.genres, ['lounge', 'calm']);
  assert.equal(t.licenceUrl, 'https://creativecommons.org/licenses/by-sa/3.0/');
  assert.equal(licenceName(t), 'CC BY-SA 3.0');
  assert.match(creditText(t, 'Ejemplo'), /"Uno" de Ejemplo, con licencia CC BY-SA 3\.0 \(https:\/\/creativecommons\.org\/licenses\/by-sa\/3\.0\/\)/);
});
