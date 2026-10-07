/**
 * Audible cues without audio files: short WebAudio signals for the countdown,
 * exercise changes and the end of a session. Every call is a no-op when the
 * browser offers no AudioContext or the sound is switched off.
 */
export function createCues() {
  let context = null;
  let enabled = true;

  function ensureContext() {
    if (!enabled) return null;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    if (!context) context = new AudioCtor();
    if (context.state === "suspended") context.resume().catch(() => {});
    return context;
  }

  function blip({ frequency, duration = 0.12, gain = 0.05, type = "square", delay = 0 }) {
    const ctx = ensureContext();
    if (!ctx) return;
    try {
      const start = ctx.currentTime + delay;
      const oscillator = ctx.createOscillator();
      const amp = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      amp.gain.setValueAtTime(0, start);
      amp.gain.linearRampToValueAtTime(gain, start + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(amp).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    } catch {
      /* audio is a bonus, never critical */
    }
  }

  return {
    setEnabled(value) {
      enabled = Boolean(value);
      if (enabled) ensureContext();
    },
    isEnabled: () => enabled,
    /** Has to be called from within a user gesture (autoplay policy). */
    unlock() {
      const ctx = ensureContext();
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    },
    cue(kind) {
      if (!enabled) return;
      if (kind === "count") blip({ frequency: 660, duration: 0.09, gain: 0.035 });
      if (kind === "next") blip({ frequency: 880, duration: 0.16, gain: 0.05, type: "triangle" });
      // Rest: lower and longer so it differs from an exercise change.
      if (kind === "rest") {
        blip({ frequency: 520, duration: 0.18, gain: 0.04, type: "sine" });
        blip({ frequency: 390, duration: 0.22, gain: 0.035, type: "sine", delay: 0.2 });
      }
      if (kind === "done") {
        blip({ frequency: 660, duration: 0.16, gain: 0.05, type: "triangle" });
        blip({ frequency: 990, duration: 0.18, gain: 0.05, type: "triangle", delay: 0.17 });
        blip({ frequency: 1320, duration: 0.3, gain: 0.05, type: "triangle", delay: 0.36 });
      }
    },
  };
}
