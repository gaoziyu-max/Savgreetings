import { createPlayer } from './audio-controller.js';
import { tracks } from './audio/tracks.js';
const landing = document.querySelector('#landing');
const screen = document.querySelector('#player');
const start = document.querySelector('#start');
const pads = [...document.querySelectorAll('.pad')];
const status = document.querySelector('#status');
const player = createPlayer(src => new Audio(src), ({ type, index }) => {
  pads.forEach((pad, i) => pad.classList.toggle('is-playing', type === 'playing' && i === index));
  const name = tracks[index]?.name;
  status.textContent = {
    idle: '选择一个声音，开启此刻。',
    missing: `${name} · 音频待添加`,
    loading: `${name} · 加载中…`,
    playing: `${name} · 正在播放`,
    error: `${name} · 暂时无法播放，请稍后重试。`,
  }[type];
});
start.addEventListener('click', () => {
  landing.hidden = true; screen.hidden = false;
  document.querySelector('#page-title').focus();
});
document.querySelector('#back').addEventListener('click', event => {
  event.preventDefault(); player.stop(); screen.hidden = true; landing.hidden = false; start.focus();
});
pads.forEach((pad, index) => {
  pad.addEventListener('click', () => {
    pad.classList.remove('hit');
    void pad.offsetWidth;
    pad.classList.add('hit');
    player.play(index, tracks[index].src);
  });
  pad.addEventListener('animationend', () => pad.classList.remove('hit'));
});
window.addEventListener('pagehide', () => player.stop());
