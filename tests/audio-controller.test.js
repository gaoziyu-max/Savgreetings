import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer } from '../audio-controller.js';

function setup() {
  const sounds = [], states = [];
  const player = createPlayer(src => {
    const sound = { src, currentTime: 7, paused: false, play() { return Promise.resolve(); }, pause() { this.paused = true; } };
    sounds.push(sound); return sound;
  }, state => states.push(state));
  return { player, sounds, states };
}
test('new clicks stop and reset previous playback, including same pad', async () => {
  const { player, sounds, states } = setup();
  await player.play(0, 'one.mp3'); await player.play(1, 'two.mp3');
  assert.equal(sounds[0].paused, true); assert.equal(sounds[0].currentTime, 0);
  await player.play(1, 'two.mp3');
  assert.equal(sounds[1].paused, true); assert.equal(sounds[2].currentTime, 0);
  assert.deepEqual(states.at(-1), { type: 'playing', index: 1 });
});
test('missing audio stops previous sound and reports missing', async () => {
  const { player, sounds, states } = setup();
  await player.play(0, 'one.mp3'); await player.play(2, '');
  assert.equal(sounds[0].paused, true); assert.deepEqual(states.at(-1), {type:'missing', index:2});
});
test('stale rejection and ended events cannot replace newest playback state', async () => {
  const { player, sounds, states } = setup();
  await player.play(0, 'one.mp3');
  const oldEnded = sounds[0].onended;
  let reject;
  sounds[0].play = () => new Promise((_, r) => { reject = r; });
  // A separate controller supplies a delayed first playback.
  let count = 0;
  const delayed = createPlayer(() => count++ === 0 ? sounds[0] : sounds[1], s => states.push(s));
  const first = delayed.play(0, 'one.mp3');
  await player.play(1, 'two.mp3');
  await delayed.play(1, 'two.mp3');
  reject(new Error('interrupted')); await first; oldEnded();
  assert.deepEqual(states.at(-1), {type:'playing', index:1});
});
test('stop, ended and playback failures produce appropriate states', async () => {
  const { player, sounds, states } = setup();
  await player.play(0, 'one.mp3'); sounds[0].onended();
  assert.equal(states.at(-1).type, 'idle');
  await player.play(0, 'one.mp3'); sounds[1].onerror();
  assert.equal(states.at(-1).type, 'error');
  await player.play(1, 'two.mp3'); player.stop();
  assert.equal(sounds[2].paused, true); assert.equal(states.at(-1).type, 'idle');
});
