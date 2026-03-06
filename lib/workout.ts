export type SequenceType = "interval" | "stairstep" | "mixed";

export interface WorkoutConfig {
  totalTime: number;       // minutes
  startIntensity: number;  // 1–20
  startCadence: number;    // RPM
  upperIntensity: number;  // 1–20
  upperCadence: number;    // RPM
  intervalDuration: number; // minutes, 1–4
  sequenceType: SequenceType;
}

export interface Segment {
  intensity: number;
  cadence: number;
  duration: number; // seconds
  label: string;
  phase: "low" | "high" | "step";
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

// Interval: alternates low ↔ high each intervalDuration minutes
function generateIntervalSegments(config: WorkoutConfig): Segment[] {
  const { totalTime, startIntensity, startCadence, upperIntensity, upperCadence, intervalDuration } = config;
  const totalSeconds = totalTime * 60;
  const stepSeconds = intervalDuration * 60;
  const segments: Segment[] = [];
  let elapsed = 0;
  let intervalNum = 1;
  let isHigh = false;

  while (elapsed < totalSeconds) {
    const duration = Math.min(stepSeconds, totalSeconds - elapsed);
    segments.push({
      intensity: isHigh ? upperIntensity : startIntensity,
      cadence: isHigh ? upperCadence : startCadence,
      duration,
      label: isHigh ? `Interval ${intervalNum} — High` : `Interval ${intervalNum} — Low`,
      phase: isHigh ? "high" : "low",
    });
    elapsed += duration;
    if (isHigh) intervalNum++;
    isHigh = !isHigh;
  }

  return segments;
}

// Stairstep: goes from startIntensity up by 1 each step, for 5 increments (6 levels).
// Cadence is linearly interpolated. Pattern repeats from bottom after reaching top.
function generateStairstepSegments(config: WorkoutConfig): Segment[] {
  const { totalTime, startIntensity, startCadence, upperIntensity, upperCadence, intervalDuration } = config;
  const totalSeconds = totalTime * 60;
  const stepSeconds = intervalDuration * 60;
  const segments: Segment[] = [];
  let elapsed = 0;
  const numIncrements = 5; // +1 each step, 5 times → 6 levels (0–5)
  const peakIntensity = Math.min(startIntensity + numIncrements, upperIntensity);
  const peakCadence = upperCadence;
  let stepIndex = 0;

  while (elapsed < totalSeconds) {
    const duration = Math.min(stepSeconds, totalSeconds - elapsed);
    const t = stepIndex / numIncrements;
    segments.push({
      intensity: lerp(startIntensity, peakIntensity, t),
      cadence: lerp(startCadence, peakCadence, t),
      duration,
      label: `Step ${stepIndex + 1} of ${numIncrements + 1}`,
      phase: "step",
    });
    elapsed += duration;
    stepIndex = (stepIndex + 1) % (numIncrements + 1);
  }

  return segments;
}

// Mixed: staircase up (5 increments), hold at peak, recovery at base, repeat.
function generateMixedSegments(config: WorkoutConfig): Segment[] {
  const { totalTime, startIntensity, startCadence, upperIntensity, upperCadence, intervalDuration } = config;
  const totalSeconds = totalTime * 60;
  const stepSeconds = intervalDuration * 60;
  const segments: Segment[] = [];
  let elapsed = 0;
  const numIncrements = 5;
  const peakIntensity = Math.min(startIntensity + numIncrements, upperIntensity);

  function push(intensity: number, cadence: number, label: string, phase: Segment["phase"]) {
    if (elapsed >= totalSeconds) return;
    const duration = Math.min(stepSeconds, totalSeconds - elapsed);
    segments.push({ intensity, cadence, duration, label, phase });
    elapsed += duration;
  }

  while (elapsed < totalSeconds) {
    // Staircase up
    for (let i = 0; i <= numIncrements; i++) {
      const t = i / numIncrements;
      push(
        lerp(startIntensity, peakIntensity, t),
        lerp(startCadence, upperCadence, t),
        `Build ${i + 1}/${numIncrements + 1}`,
        "step"
      );
    }
    // Hold at peak
    push(upperIntensity, upperCadence, "Peak Hold", "high");
    // Recovery
    push(startIntensity, startCadence, "Recovery", "low");
  }

  return segments;
}

export function generateSegments(config: WorkoutConfig): Segment[] {
  switch (config.sequenceType) {
    case "interval":   return generateIntervalSegments(config);
    case "stairstep":  return generateStairstepSegments(config);
    case "mixed":      return generateMixedSegments(config);
  }
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
