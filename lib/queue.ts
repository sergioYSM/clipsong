// Pure queue logic. Two queues: the user's queue (added by hand, plays first)
// and the context (album, playlist...) whose play order shuffle permutes.

export type Repeat = 'off' | 'all' | 'one';

export interface QueueState {
  contextIds: string[];   // tracks of the context, in their real order
  order: number[];        // play order: indices into contextIds
  pos: number;            // position in `order` of the current context track
  userQueue: string[];    // track ids added by hand
  current: string | null; // what is playing now (context or user queue)
  fromUserQueue: boolean;
  shuffle: boolean;
  repeat: Repeat;
}

export const emptyQueue: QueueState = {
  contextIds: [], order: [], pos: 0, userQueue: [], current: null,
  fromUserQueue: false, shuffle: false, repeat: 'off',
};

export function shuffled(n: number, first: number, rand: () => number = Math.random): number[] {
  const rest: number[] = [];
  for (let i = 0; i < n; i++) if (i !== first) rest.push(i);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return first >= 0 && first < n ? [first, ...rest] : rest;
}

const identity = (n: number) => Array.from({ length: n }, (_, i) => i);

export function playContext(s: QueueState, ids: string[], start: number, rand?: () => number): QueueState {
  const i = Math.max(0, Math.min(start, ids.length - 1));
  const order = s.shuffle ? shuffled(ids.length, i, rand) : identity(ids.length);
  return { ...s, contextIds: ids, order, pos: s.shuffle ? 0 : i, current: ids[i] ?? null, fromUserQueue: false };
}

/** auto = the track ended by itself (repeat one replays it). */
export function next(s: QueueState, auto = false, rand?: () => number): QueueState {
  if (auto && s.repeat === 'one' && s.current) return s;
  if (s.userQueue.length) {
    const [head, ...rest] = s.userQueue;
    return { ...s, userQueue: rest, current: head, fromUserQueue: true };
  }
  if (!s.contextIds.length) return { ...s, current: null };
  let pos = s.fromUserQueue ? s.pos + 1 : s.pos + 1;
  let order = s.order;
  if (pos >= order.length) {
    if (s.repeat === 'off') return { ...s, current: null, fromUserQueue: false, pos: order.length - 1 };
    pos = 0;
    if (s.shuffle) order = shuffled(s.contextIds.length, -1, rand);
  }
  return { ...s, order, pos, current: s.contextIds[order[pos]], fromUserQueue: false };
}

export function prev(s: QueueState): QueueState {
  if (!s.contextIds.length) return s;
  if (s.fromUserQueue) return { ...s, current: s.contextIds[s.order[s.pos]], fromUserQueue: false };
  const pos = s.pos > 0 ? s.pos - 1 : s.repeat === 'all' ? s.order.length - 1 : 0;
  return { ...s, pos, current: s.contextIds[s.order[pos]] };
}

export function setShuffle(s: QueueState, on: boolean, rand?: () => number): QueueState {
  if (on === s.shuffle) return s;
  const n = s.contextIds.length;
  const realIdx = n ? s.order[s.pos] : -1;
  if (on) return { ...s, shuffle: true, order: shuffled(n, realIdx, rand), pos: 0 };
  return { ...s, shuffle: false, order: identity(n), pos: Math.max(0, realIdx) };
}

export function cycleRepeat(r: Repeat): Repeat {
  return r === 'off' ? 'all' : r === 'all' ? 'one' : 'off';
}

export function addToQueue(s: QueueState, id: string): QueueState {
  return { ...s, userQueue: [...s.userQueue, id] };
}
export function removeFromQueue(s: QueueState, index: number): QueueState {
  return { ...s, userQueue: s.userQueue.filter((_, i) => i !== index) };
}
export function moveInQueue(s: QueueState, from: number, to: number): QueueState {
  const q = [...s.userQueue];
  const [x] = q.splice(from, 1);
  q.splice(Math.max(0, Math.min(to, q.length)), 0, x);
  return { ...s, userQueue: q };
}
export function clearQueue(s: QueueState): QueueState {
  return { ...s, userQueue: [] };
}

/** What plays after the current track, from the context (for the queue view). */
export function upNextFromContext(s: QueueState, limit = 50): string[] {
  if (s.repeat === 'one') return [];
  const out: string[] = [];
  for (let p = s.pos + 1; p < s.order.length && out.length < limit; p++) out.push(s.contextIds[s.order[p]]);
  return out;
}
