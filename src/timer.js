/**
 * Drift-free session timer.
 *
 * The remaining time is derived from timestamps instead of counting ticks. When the
 * tab runs in the background and `requestAnimationFrame` gets throttled, the next
 * frame picks up the elapsed time correctly – so the session stays exact even if
 * the display was not updated in between.
 */
export function createSessionTimer({
  sequence,
  onUpdate,
  onTransition,
  onComplete,
  onBeep,
  now = () => performance.now(),
}) {
  if (!Array.isArray(sequence) || sequence.length === 0) {
    throw new Error("Der Timer braucht mindestens eine Übung.");
  }

  const durations = sequence.map((item) => item.seconds * 1000);
  const totalMs = durations.reduce((sum, ms) => sum + ms, 0);

  let index = 0;
  let remaining = durations[0];
  let running = false;
  let frame = null;
  let lastTimestamp = 0;
  let lastEmittedSecond = null;
  let lastEmitAt = 0;

  function state() {
    const remainingAfter = durations.slice(index + 1).reduce((sum, ms) => sum + ms, 0);
    return {
      index,
      remaining,
      durations,
      totalMs,
      running,
      finished: index === sequence.length - 1 && remaining <= 0,
      exerciseProgress: 1 - remaining / durations[index],
      sessionProgress: 1 - (remaining + remainingAfter) / totalMs,
      sessionRemaining: remaining + remainingAfter,
    };
  }

  function emit(force = false) {
    const stamp = now();
    const second = Math.ceil(remaining / 1000);
    if (!force && second === lastEmittedSecond && stamp - lastEmitAt < 80) return;
    lastEmittedSecond = second;
    lastEmitAt = stamp;
    onUpdate?.(state());
  }

  function advance(deltaMs) {
    remaining -= deltaMs;
    let guard = 0;

    while (remaining <= 0 && index < sequence.length - 1 && guard++ < sequence.length + 1) {
      const carry = -remaining;
      index += 1;
      remaining = durations[index] - carry;
      onTransition?.(index, sequence[index]);
      // Rests get their own, softer signal.
      if (remaining > 0) onBeep?.(sequence[index].rest ? "rest" : "next");
    }

    if (remaining <= 0) {
      remaining = 0;
      running = false;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      emit(true);
      onBeep?.("done");
      onComplete?.(state());
      return;
    }

    const second = Math.ceil(remaining / 1000);
    if (second !== lastEmittedSecond && second > 0 && second <= 3) onBeep?.("count");
    emit();
  }

  function loop(timestamp) {
    if (!running) return;
    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    advance(delta > 0 ? delta : 0);
    if (running) frame = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    lastTimestamp = now();
    emit(true);
    frame = requestAnimationFrame(loop);
  }

  function pause() {
    if (!running) return;
    running = false;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    emit(true);
  }

  function toggle() {
    running ? pause() : start();
  }

  function select(nextIndex) {
    index = Math.min(Math.max(nextIndex, 0), sequence.length - 1);
    remaining = durations[index];
    lastEmittedSecond = null;
    lastTimestamp = now();
    onTransition?.(index, sequence[index]);
    emit(true);
  }

  function step(direction) {
    const wrapped = (index + direction + sequence.length) % sequence.length;
    select(wrapped);
  }

  function reset() {
    pause();
    select(0);
  }

  function destroy() {
    pause();
    onUpdate = onTransition = onComplete = onBeep = null;
  }

  return { start, pause, toggle, step, select, reset, destroy, state, isRunning: () => running };
}
