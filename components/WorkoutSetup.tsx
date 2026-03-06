"use client";

import { useState, useEffect } from "react";
import { WorkoutConfig, SequenceType, generateSegments } from "@/lib/workout";
import { initAudio } from "@/lib/audio";
import {
  getSavedWorkouts,
  saveWorkout,
  deleteWorkout,
  formatSavedDate,
  SavedWorkout,
} from "@/lib/storage";

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

// ── small reusable components ──────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
      {children}
    </label>
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
        className="w-10 h-10 rounded-xl bg-zinc-800 text-xl font-bold active:bg-zinc-700 flex items-center justify-center select-none"
      >
        −
      </button>
      <span className="w-12 text-center text-2xl font-black tabular-nums">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-10 h-10 rounded-xl bg-zinc-800 text-xl font-bold active:bg-zinc-700 flex items-center justify-center select-none"
      >
        +
      </button>
    </div>
  );
}

const SEQUENCE_OPTIONS: { value: SequenceType; label: string; desc: string }[] = [
  { value: "interval",  label: "Interval",  desc: "Alternates low ↔ high each period" },
  { value: "stairstep", label: "Stairstep", desc: "Steps up +1 per interval (5 increments)" },
  { value: "mixed",     label: "Mixed",     desc: "Staircase up → peak hold → recovery" },
];

// ── Main component ─────────────────────────────────────────────────────────

export default function WorkoutSetup({ onStart }: Props) {
  const [cfg, setCfg] = useState<WorkoutConfig>(DEFAULT_CONFIG);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<SavedWorkout[]>([]);
  const [justSaved, setJustSaved] = useState(false);

  // Load saved workouts client-side only
  useEffect(() => {
    setSaved(getSavedWorkouts());
  }, []);

  function set<K extends keyof WorkoutConfig>(key: K, value: WorkoutConfig[K]) {
    setCfg((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function validate(): string {
    if (cfg.upperIntensity <= cfg.startIntensity)
      return "Upper intensity must be greater than starting intensity.";
    if (cfg.upperCadence <= cfg.startCadence)
      return "Upper cadence must be greater than starting cadence.";
    if (generateSegments(cfg).length === 0)
      return "Could not generate segments — check your settings.";
    return "";
  }

  function handleStart() {
    const err = validate();
    if (err) { setError(err); return; }
    initAudio(); // unlock audio during user gesture
    onStart(cfg);
  }

  function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    saveWorkout(cfg);
    const updated = getSavedWorkouts();
    setSaved(updated);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }

  function handleLoad(w: SavedWorkout) {
    setCfg(w.config);
    setError("");
  }

  function handleDelete(id: string) {
    deleteWorkout(id);
    setSaved(getSavedWorkouts());
  }

  const segCount = generateSegments(cfg).length;

  return (
    <div className="flex flex-col gap-5 p-5 pb-10">
      {/* Header */}
      <div className="pt-4 pb-1">
        <h1 className="text-2xl font-black tracking-tight">Workout Setup</h1>
        <p className="text-sm text-zinc-500 mt-1">Configure your session below</p>
      </div>

      {/* ── Saved Workouts ── */}
      {saved.length > 0 && (
        <div className="rounded-2xl bg-zinc-900 p-4 flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Recent Workouts
          </h2>
          {saved.map((w) => (
            <div
              key={w.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-zinc-100 truncate">{w.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {w.config.startIntensity}→{w.config.upperIntensity} intensity ·{" "}
                  {w.config.startCadence}→{w.config.upperCadence} rpm ·{" "}
                  {w.config.intervalDuration} min intervals
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">{formatSavedDate(w.savedAt)}</p>
              </div>
              <button
                onClick={() => handleLoad(w)}
                className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-semibold active:bg-orange-500/30"
              >
                Load
              </button>
              <button
                onClick={() => handleDelete(w.id)}
                className="flex-shrink-0 w-7 h-7 rounded-lg bg-zinc-700 text-zinc-400 text-sm flex items-center justify-center active:bg-zinc-600"
                aria-label="Delete"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Duration ── */}
      <div className="rounded-2xl bg-zinc-900 p-4 flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Duration</h2>
        <div className="flex flex-col gap-1">
          <Label>Total Time (minutes)</Label>
          <NumInput value={cfg.totalTime} onChange={(v) => set("totalTime", v)} min={5} max={120} />
        </div>
      </div>

      {/* ── Targets ── */}
      <div className="rounded-2xl bg-zinc-900 p-4 flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Targets</h2>
        <div className="grid grid-cols-2 gap-5">
          {/* Starting column */}
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-zinc-300">Starting</p>
            <div className="flex flex-col gap-1">
              <Label>Intensity</Label>
              <NumInput value={cfg.startIntensity} onChange={(v) => set("startIntensity", v)} min={1} max={19} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Cadence (RPM)</Label>
              <NumInput value={cfg.startCadence} onChange={(v) => set("startCadence", v)} min={40} max={130} />
            </div>
          </div>
          {/* Upper column */}
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-orange-400">Upper</p>
            <div className="flex flex-col gap-1">
              <Label>Intensity</Label>
              <NumInput value={cfg.upperIntensity} onChange={(v) => set("upperIntensity", v)} min={2} max={20} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Cadence (RPM)</Label>
              <NumInput value={cfg.upperCadence} onChange={(v) => set("upperCadence", v)} min={41} max={140} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Interval Duration ── */}
      <div className="rounded-2xl bg-zinc-900 p-4 flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Interval Duration
        </h2>
        <Label>{cfg.intervalDuration} minute{cfg.intervalDuration > 1 ? "s" : ""} per segment</Label>
        <input
          type="range"
          min={1}
          max={4}
          step={1}
          value={cfg.intervalDuration}
          onChange={(e) => set("intervalDuration", Number(e.target.value))}
          className="w-full accent-orange-500 h-2"
        />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>1 min</span><span>2 min</span><span>3 min</span><span>4 min</span>
        </div>
      </div>

      {/* ── Sequence Type ── */}
      <div className="rounded-2xl bg-zinc-900 p-4 flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Sequence Type
        </h2>
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
                  cfg.sequenceType === opt.value
                    ? "border-orange-500 bg-orange-500"
                    : "border-zinc-500"
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
        <span className="text-zinc-200 font-semibold">{segCount} segments</span>
        {" · "}{cfg.totalTime} min total · {cfg.intervalDuration} min each
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/20 border border-red-500/50 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Actions */}
      <button
        onClick={handleStart}
        className="w-full py-4 rounded-2xl bg-orange-500 text-white text-lg font-black tracking-wide active:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
      >
        Start Workout
      </button>

      <button
        onClick={handleSave}
        className={`w-full py-3 rounded-2xl border text-sm font-semibold transition-colors ${
          justSaved
            ? "bg-green-500/20 border-green-500 text-green-400"
            : "bg-zinc-800/50 border-zinc-700 text-zinc-300 active:bg-zinc-700"
        }`}
      >
        {justSaved ? "✓ Saved!" : "Save This Workout"}
      </button>
    </div>
  );
}
