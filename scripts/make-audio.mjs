// Generates demo audio for the seed catalogue: soft chords pulsing at each track's tempo.
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
const src = readFileSync(new URL('../lib/seed.ts', import.meta.url), 'utf8');
const re = /\['(t\d+)', 'al\d', '[^']*', (\d+), '[^']*', \[[^\]]*\], (\d+), (\d+)\]/g;
mkdirSync('public/audio', { recursive: true });
for (const [, id, sec, f, bpm] of src.matchAll(re)) {
  const out = `public/audio/${id}.mp3`;
  if (existsSync(out)) continue;
  const b = Number(bpm) / 60;
  const expr = `(0.18*sin(2*PI*${f}*t)+0.12*sin(2*PI*${f}*1.25*t)+0.10*sin(2*PI*${f}*1.5*t)+0.08*sin(2*PI*${f}/2*t))*(0.55+0.45*pow(abs(cos(PI*${b}*t)),6))*min(1,t/2)*min(1,(${sec}-t)/2)`;
  execFileSync('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', `aevalsrc=exprs='${expr}':s=22050:d=${sec}`, '-ac', '1', '-b:a', '48k', out]);
  console.log('wrote', out);
}
