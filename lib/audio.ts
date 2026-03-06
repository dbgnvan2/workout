// Web Audio API — all sounds synthesized, no external files needed.
// initAudio() MUST be called during a user-gesture (button click) to unlock
// audio on iOS/Safari before any playback functions will work.

let ctx: AudioContext | null = null;

export function initAudio(): void {
  if (typeof window === "undefined") return;
  try {
    if (!ctx || ctx.state === "closed") {
      ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
    }
    if (ctx.state === "suspended") ctx.resume();
    // Play silent buffer to unlock iOS audio restriction
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    // Audio unavailable — sounds will be silently skipped
  }
}

function getCtx(): AudioContext | null {
  if (!ctx || ctx.state !== "running") return null;
  return ctx;
}

/** Sharp tick — plays each second during the last-10-second countdown */
export function playBeep(): void {
  const ac = getCtx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    const t = ac.currentTime;
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    osc.start(t);
    osc.stop(t + 0.13);
  } catch { /* ignore */ }
}

/** Build one bell strike from sine-wave partials */
function strike(
  ac: AudioContext,
  startTime: number,
  partials: [number, number][],
  decay: number
): void {
  for (const [freq, vol] of partials) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.connect(g);
    g.connect(ac.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(vol, startTime + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + decay);
    osc.start(startTime);
    osc.stop(startTime + decay + 0.02);
  }
}

/** "Ding-a-ling" — two-tone bell played when an interval completes */
export function playBell(): void {
  const ac = getCtx();
  if (!ac) return;
  try {
    const t = ac.currentTime;
    // "Ding" — A5 + harmonics
    strike(ac, t, [
      [880,  0.30],
      [1760, 0.14],
      [2640, 0.06],
    ], 1.3);
    // "Ling" — C6 + harmonics, 350 ms later
    strike(ac, t + 0.35, [
      [1047, 0.25],
      [2094, 0.11],
      [3136, 0.05],
    ], 1.1);
  } catch { /* ignore */ }
}

/** Triple bell for workout completion */
export function playFinalBell(): void {
  const ac = getCtx();
  if (!ac) return;
  try {
    const t = ac.currentTime;
    strike(ac, t,        [[880, 0.30], [1760, 0.14]], 1.2);
    strike(ac, t + 0.35, [[1047, 0.25], [2094, 0.11]], 1.0);
    strike(ac, t + 0.70, [[1319, 0.20], [2637, 0.09]], 0.9);
  } catch { /* ignore */ }
}
