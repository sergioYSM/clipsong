import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyQueue, playContext, next, prev, setShuffle, addToQueue, moveInQueue, upNextFromContext, cycleRepeat } from './queue.ts';

const ids = ['a', 'b', 'c', 'd'];
const seq = (vals: number[]) => { let i = 0; return () => vals[i++ % vals.length]; };

test('plays the context in order and stops at the end with repeat off', () => {
  let s = playContext(emptyQueue, ids, 1);
  assert.equal(s.current, 'b');
  s = next(s); assert.equal(s.current, 'c');
  s = next(s); assert.equal(s.current, 'd');
  s = next(s, true); assert.equal(s.current, null);
});

test('repeat all wraps around, repeat one replays only on auto advance', () => {
  let s = { ...playContext(emptyQueue, ids, 3), repeat: 'all' as const };
  s = next(s); assert.equal(s.current, 'a');
  s = { ...s, repeat: 'one' as const };
  assert.equal(next(s, true).current, 'a');
  assert.equal(next(s, false).current, 'b');
});

test('user queue plays first, then the context resumes where it was', () => {
  let s = playContext(emptyQueue, ids, 0);
  s = addToQueue(addToQueue(s, 'x'), 'y');
  s = next(s); assert.equal(s.current, 'x');
  s = next(s); assert.equal(s.current, 'y');
  s = next(s); assert.equal(s.current, 'b');
});

test('shuffle keeps the current track first and never repeats a track', () => {
  let s = playContext(emptyQueue, ids, 2);
  s = setShuffle(s, true, seq([0.9, 0.1, 0.5]));
  assert.equal(s.current, 'c');
  assert.equal(s.order[0], 2);
  assert.deepEqual([...s.order].sort(), [0, 1, 2, 3]);
  const seen = [s.current];
  for (let i = 0; i < 3; i++) { s = next(s); seen.push(s.current); }
  assert.deepEqual([...seen].sort(), ids);
});

test('shuffle only shuffles the context: it never injects other tracks', () => {
  let s = setShuffle(playContext(emptyQueue, ids, 0), true);
  const played = new Set([s.current]);
  for (let i = 0; i < 10; i++) { s = next({ ...s, repeat: 'all' }); played.add(s.current); }
  for (const t of played) assert.ok(ids.includes(t!));
});

test('turning shuffle off returns to the real position of the current track', () => {
  let s = setShuffle(playContext(emptyQueue, ids, 0), true, seq([0.99, 0.0, 0.5]));
  s = next(s);
  const cur = s.current;
  s = setShuffle(s, false);
  assert.equal(s.contextIds[s.order[s.pos]], cur);
  assert.deepEqual(upNextFromContext(s), ids.slice(ids.indexOf(cur!) + 1));
});

test('prev goes back, and from a user-queue track returns to the context track', () => {
  let s = playContext(emptyQueue, ids, 2);
  assert.equal(prev(s).current, 'b');
  s = next(addToQueue(s, 'x'));
  assert.equal(s.current, 'x');
  assert.equal(prev(s).current, 'c');
});

test('reorder and cycle helpers', () => {
  const s = moveInQueue({ ...emptyQueue, userQueue: ['x', 'y', 'z'] }, 2, 0);
  assert.deepEqual(s.userQueue, ['z', 'x', 'y']);
  assert.equal(cycleRepeat('off'), 'all');
  assert.equal(cycleRepeat('all'), 'one');
  assert.equal(cycleRepeat('one'), 'off');
});
