"use client";

import { useState } from "react";
import { WorkoutConfig, SequenceType, generateSegments } from "@/lib/workout";

const DEFAULT_CONFIG: WorkoutConfig = {
  totalTime: 30,
  startIntensity: 5,
  startCadence: 80,
  upperIntensity: 10,
  upperCadence: 95,
  intervalDuration: 2,
  sequenceType: "interval",
};

interface Props {
  onStart: (config: WorkoutConfig) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function NumInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-200 text-xl font-bold active:bg-zinc-700 flex items-center justify-center select-none"
      >
        −
      </button>
      <span className="w-12 text-center text-2xl font-bold tabular-nums">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-200 text-xl font-bold active:bg-zinc-700 flex items-center justify-center select-none"
      >
        +
      </button>
    </div>
  );
}

const SEQUENCE_OPTIONS: { value: SequenceType; label: string; desc: string }[] = [
  {
    value: "interval",
    label: "Interval",
    desc: "Alternates low ↔ high each period",
  },
  {
    value: "stairstep",
    label: "Stairstep",
    desc: "Steps up +1 per interval (5 increments)",
  },
  {
    value: "mixed",
    label: "Mixed",
    desc: "Staircase up → peak hold → recovery",
  },
];

export default function WorkoutSetup({ onStart }: Props) {
  const [cfg, setCfg] = useState<WorkoutConfig>(DEFAULT_CONFIG);
  const [error, setError] = useState("");

  function set<K extends keyof WorkoutConfig>(key: K, value: WorkoutConfig[K]) {
    setCfg((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function handleStart() {
    if (cfg.upperIntensity <= cfg.startIntensity) {
      setError("Upper intensity must be greater than starting intensity.");
      return;
    }
    if (cfg.upperCadence <= cfg.startCadence) {
      setError("Upper cadence must be greater than starting cadence.");
      return;
    }
    const segs = generateSegments(cfg);
    if (segs.length === 0) {
      setError("Could not generate workout segments. Check your settings.");
      return;
    }
    onStart(cfg);
  }

  // Interval count preview
  const segCount = generateSegments(cfg).length;

  return (
    <div className="flex flex-col gap-5 p-5 pb-10">
      {/* Header */}
      <div className="pt-4 pb-2">
        <h1 className="text-2xl font-black tracking-tight">Workout Setup</h1>
        <p className="text-sm text-zinc-500 mt-1">Configure your session below</p>
      </div>

      {/* Total Time */}
      <div className="rounded-2xl bg-zinc-900 p-4 flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Duration</h2>
        <Field label="Total Time (minutes)">
          <NumInput value={cfg.totalTime} onChange={(v) => set("totalTime", v)} min={5} max={120} />
        </Field>
      </div>

      {/* Intensity & Cadence */}
      <div className="rounded-2xl bg-zinc-900 p-4 flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Targets</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-zinc-300">Starting</p>
            <Field label="Intensity">
              <NumInput value={cfg.startIntensity} onChange={(v) => set("startIntensity", v)} min={1} max={19} />
            </Field>
            <Field label="Cadence (RPM)">
              <NumInput value={cfg.startCadence} onChange={(v) => set("startCadence", v)} min={40} max={130} />
            </Field>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-orange-400">Upper</p>
            <Field label="Intensity">
              <NumInput value={cfg.upperIntensity} onChange={(v) => set("upperIntensity", v)} min={2} max={20} />
            </Field>
            <Field label="Cadence (RPM)">
              <NumInput value={cfg.upperCadence} onChange={(v) => set("upperCadence", v)} min={41} max={140} />
            </Field>
          </div>
        </div>
      </div>

      {/* Interval Duration */}
      <div className="rounded-2xl bg-zinc-900 p-4 flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Interval Duration</h2>
        <Field label={`${cfg.intervalDuration} minute${cfg.intervalDuration > 1 ? "s" : ""} per segment`}>
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={cfg.intervalDuration}
            onChange={(e) => set("intervalDuration", Number(e.target.value))}
            className="w-full accent-orange-500 h-2"
          />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>1 min</span><span>2 min</span><span>3 min</span><span>4 min</span>
          </div>
        </Field>
      </div>

      {/* Sequence Type */}
      <div className="rounded-2xl bg-zinc-900 p-4 flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Sequence Type</h2>
        <div className="flex flex-col gap-2">
          {SEQUENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => set("sequenceType", opt.value)}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                cfg.sequenceType === opt.value
                  ? "bg-orange-500/20 border-orange-500 text-orange-100"
                  : "bg-zinc-800/50 border-zinc-700 text-zinc-300 active:bg-zinc-700"
              }`}
            >
              <div
                className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                  cfg.sequenceType === opt.value ? "border-orange-500 bg-orange-500" : "border-zinc-500"
                }`}
              />
              <div>
                <p className="font-semibold text-sm">{opt.label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-2xl bg-zinc-800/50 border border-zinc-800 p-4 text-sm text-zinc-400">
        <span className="text-zinc-200 font-semibold">{segCount} segments</span> ·{" "}
        {cfg.totalTime} min total · {cfg.intervalDuration} min each
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/20 border border-red-500/50 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Start */}
      <button
        onClick={handleStart}
        className="w-full py-4 rounded-2xl bg-orange-500 text-white text-lg font-black tracking-wide active:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
      >
        Start Workout
      </button>
    </div>
  );
}
