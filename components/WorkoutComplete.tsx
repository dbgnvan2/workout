"use client";

import { WorkoutConfig, formatTime, formatClockTime } from "@/lib/workout";

interface Props {
  config: WorkoutConfig;
  startTime: Date;
  elapsed: number;
  onReset: () => void;
}

export default function WorkoutComplete({ config, startTime, elapsed, onReset }: Props) {
  const endTime = new Date(startTime.getTime() + elapsed * 1000);

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 text-center min-h-screen">
      <div className="text-6xl">🔥</div>

      <div>
        <h1 className="text-3xl font-black tracking-tight">Workout Complete!</h1>
        <p className="text-zinc-500 mt-2">Great job pushing through.</p>
      </div>

      <div className="w-full rounded-2xl bg-zinc-900 p-5 flex flex-col gap-4 text-left">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 text-center mb-1">
          Summary
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Duration" value={formatTime(elapsed)} />
          <Stat label="Target" value={`${config.totalTime} min`} />
          <Stat label="Started" value={formatClockTime(startTime)} />
          <Stat label="Ended" value={formatClockTime(endTime)} />
          <Stat label="Sequence" value={config.sequenceType.charAt(0).toUpperCase() + config.sequenceType.slice(1)} />
          <Stat label="Interval" value={`${config.intervalDuration} min`} />
          <Stat label="Intensity" value={`${config.startIntensity} → ${config.upperIntensity}`} />
          <Stat label="Cadence" value={`${config.startCadence} → ${config.upperCadence} rpm`} />
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full py-4 rounded-2xl bg-orange-500 text-white text-lg font-black tracking-wide active:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
      >
        New Workout
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-800 p-3">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-base font-bold text-zinc-100">{value}</p>
    </div>
  );
}
