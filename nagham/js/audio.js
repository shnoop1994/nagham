/** Lightweight Web Audio piano voice with soft attack for Arabic feel */

let ctx = null;
const active = new Map();

export function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

export function playTone(id, hz, { velocity = 0.85 } = {}) {
  const audio = ensureAudio();
  stopTone(id, 0.02);

  const now = audio.currentTime;
  const master = audio.createGain();
  master.gain.value = 0;
  master.connect(audio.destination);

  // Warm fundamental + soft partials
  const partials = [
    { type: "sine", mul: 1, gain: 0.55 },
    { type: "triangle", mul: 2, gain: 0.16 },
    { type: "sine", mul: 3, gain: 0.08 },
    { type: "sine", mul: 4.01, gain: 0.04 },
  ];

  const nodes = [];
  for (const p of partials) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = p.type;
    osc.frequency.value = hz * p.mul;
    g.gain.value = p.gain;
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    nodes.push(osc);
  }

  const peak = 0.22 * Math.min(1, Math.max(0.2, velocity));
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(peak, now + 0.018);
  master.gain.exponentialRampToValueAtTime(peak * 0.55, now + 0.22);
  master.gain.setTargetAtTime(peak * 0.28, now + 0.45, 0.35);

  active.set(id, { master, nodes, hz });
}

export function stopTone(id, release = 0.18) {
  const voice = active.get(id);
  if (!voice) return;
  active.delete(id);

  const audio = ensureAudio();
  const now = audio.currentTime;
  try {
    voice.master.gain.cancelScheduledValues(now);
    voice.master.gain.setValueAtTime(Math.max(voice.master.gain.value, 0.0001), now);
    voice.master.gain.exponentialRampToValueAtTime(0.0001, now + release);
  } catch {
    /* ignore */
  }

  const stopAt = now + release + 0.05;
  for (const osc of voice.nodes) {
    try {
      osc.stop(stopAt);
    } catch {
      /* ignore */
    }
  }

  window.setTimeout(() => {
    try {
      voice.master.disconnect();
    } catch {
      /* ignore */
    }
  }, (release + 0.1) * 1000);
}

export function stopAll() {
  for (const id of [...active.keys()]) {
    stopTone(id, 0.08);
  }
}
