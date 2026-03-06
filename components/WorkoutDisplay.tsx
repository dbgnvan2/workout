"use client";

import { useEffect, useRef, useState } from "react";
import { Segment, WorkoutConfig, formatTime, formatClockTime } from "@/lib/workout";

interface Props {
  config: WorkoutConfig;
  segments: Segment[];
  startTime: Date;
  onComplete: (elapsed: number) => void;
  onStop: () => void;
}

function PhaseTag({ phase }: { phase: Segment["phase"] }) {
  const map = {
    low:  { cls: "bg-sky-500",    label: "LOW"  },
    high: { cls: "bg-orange-500", label: "HIGH" },
    step: { cls: "bg-amber-500",  label: "STEP" },
  };
  const { cls, label } = map[phase];
  return (
    <span className={`${cls} text-white text-xs font-black px-2 py-0.5 rounded-md tracking-widest`}>
      {label}
    </span>
  );
}

export default function WorkoutDisplay({ config, segments, startTime, onComplete, onStop }: Props) {
  const totalDuration = config.totalTime * 60;

  // Mutable state kept in a ref so the interval closure always sees fresh values
  const stateRef = useRef({
    segIndex: 0,
    segElapsed: 0,
    totalElapsed: 0,
    paused: false,
    done: false,
  });

  // React display state (updated every second)
  const [display, setDisplay] = useState({
    segIndex: 0,
    segElapsed: 0,
    totalElapsed: 0,
    paused: false,
  });

  // Run the timer
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.paused || s.done) return;

      s.totalElapsed += 1;
      s.segElapsed += 1;

      // Advance through segments
      while (
        s.segIndex < segments.length &&
        s.segElapsed >= segments[s.segIndex].duration
      ) {
        s.segElapsed -= segments[s.segIndex].duration;
        s.segIndex++;
      }

      setDisplay({
        segIndex: s.segIndex,
        segElapsed: s.segElapsed,
        totalElapsed: s.totalElapsed,
        paused: s.paused,
      });

      if (s.totalElapsed >= totalDuration || s.segIndex >= segments.length) {
        s.done = true;
        clearInterval(interval);
        onComplete(s.totalElapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  // Only run once on mount; segments/config won't change mid-workout
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePause() {
    stateRef.current.paused = !stateRef.current.paused;
    setDisplay((d) => ({ ...d, paused: !d.paused }));
  }

  const safeIdx = Math.min(display.segIndex, segments.length - 1);
  const currentSeg = segments[safeIdx];
  const nextSeg = segments[safeIdx + 1];

  const segTimeLeft = currentSeg ? Math.max(0, currentSeg.duration - display.segElapsed) : 0;
  const totalTimeLeft = Math.max(0, totalDuration - display.totalElapsed);
  const segProgress = currentSeg ? Math.min(1, display.segElapsed / currentSeg.duration) : 1;
  const totalProgress = Math.min(1, display.totalElapsed / totalDuration);

  const phaseStyle = {
    low:  { ring: "ring-sky-500",    bar: "bg-sky-500",    text: "text-sky-400"    },
    high: { ring: "ring-orange-500", bar: "bg-orange-500", text: "text-orange-400" },
    step: { ring: "ring-amber-500",  bar: "bg-amber-500",  text: "text-amber-400"  },
  };
  const style = currentSeg ? phaseStyle[currentSeg.phase] : phaseStyle.low;

  return (
    <div className="flex flex-col gap-4 p-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-xl font-black tracking-tight">Workout Active</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Started {formatClockTime(startTime)}</p>
        </div>
        <button
          onClick={onStop}
          className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-400 text-sm font-semibold active:bg-zinc-700"
        >
          End
        </button>
      </div>

      {/* Total progress */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Elapsed {formatTime(display.totalElapsed)}</span>
          <span>{formatTime(totalTimeLeft)} left</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-zinc-400 transition-[width] duration-1000 ease-linear"
            style={{ width: `${totalProgress * 100}%` }}
          />
        </div>
        <p className="text-center text-xs text-zinc-600">
          Segment {safeIdx + 1} of {segments.length}
        </p>
      </div>

      {/* Current segment */}
      {currentSeg && (
        <div className={`rounded-2xl bg-zinc-900 ring-2 ${style.ring} p-5 flex flex-col gap-4`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-300 truncate pr-2">{currentSeg.label}</span>
            <PhaseTag phase={currentSeg.phase} />
          </div>

          {/* Big interval countdown */}
          <div className="text-center py-2">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Interval Time Left</p>
            <p className={`text-7xl font-black tabular-nums tracking-tighter ${style.text}`}>
              {formatTime(segTimeLeft)}
            </p>
          </div>

          {/* Segment progress bar */}
          <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${style.bar} transition-[width] duration-1000 ease-linear`}
              style={{ width: `${segProgress * 100}%` }}
            />
          </div>

          {/* Intensity + Cadence */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-zinc-800 p-3 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Intensity</p>
              <p className="text-4xl font-black tabular-nums">{currentSeg.intensity}</p>
            </div>
            <div className="rounded-xl bg-zinc-800 p-3 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Cadence</p>
              <p className="text-4xl font-black tabular-nums">
                {currentSeg.cadence}
                <span className="text-base font-normal text-zinc-500 ml-1">rpm</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next segment preview */}
      {nextSeg ? (
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Up Next</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-300 truncate pr-2">{nextSeg.label}</span>
            <PhaseTag phase={nextSeg.phase} />
          </div>
          <div className="flex gap-4 text-sm text-zinc-400">
            <span>Intensity <span className="text-zinc-200 font-semibold">{nextSeg.intensity}</span></span>
            <span>Cadence <span className="text-zinc-200 font-semibold">{nextSeg.cadence} rpm</span></span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 text-center text-sm text-zinc-500">
          Final segment — finish strong!
        </div>
      )}

      {/* Pause / Resume */}
      <button
        onClick={togglePause}
        className={`w-full py-4 rounded-2xl text-white text-lg font-black tracking-wide transition-colors ${
          display.paused
            ? "bg-green-600 active:bg-green-700 shadow-lg shadow-green-600/20"
            : "bg-zinc-700 active:bg-zinc-600"
        }`}
      >
        {display.paused ? "▶  Resume" : "⏸  Pause"}
      </button>
    </div>
  );
}
