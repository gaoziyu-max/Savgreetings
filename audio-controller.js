export function createPlayer(makeAudio, onState) {
  let active = null;
  let version = 0;
  function clear() {
    version++;
    if (active) {
      active.onended = active.onerror = null;
      active.pause();
      active.currentTime = 0;
      active = null;
    }
  }
  return {
    stop() { clear(); onState({ type: 'idle' }); },
    async play(index, src) {
      clear();
      const token = version;
      if (!src) { onState({ type: 'missing', index }); return; }
      try {
        const audio = makeAudio(src);
        active = audio;
        audio.currentTime = 0;
        audio.loop = false;
        const finish = type => {
          if (token !== version) return;
          clear(); onState({ type, index });
        };
        audio.onended = () => finish('idle');
        audio.onerror = () => finish('error');
        onState({ type: 'loading', index });
        await audio.play();
        if (token === version) onState({ type: 'playing', index });
      } catch {
        if (token === version) { clear(); onState({ type: 'error', index }); }
      }
    }
  };
}
