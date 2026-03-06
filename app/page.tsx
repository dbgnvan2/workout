"use client";

import { useState } from "react";
import { WorkoutConfig, Segment, generateSegments } from "@/lib/workout";
import WorkoutSetup from "@/components/WorkoutSetup";
import WorkoutDisplay from "@/components/WorkoutDisplay";
import WorkoutComplete from "@/components/WorkoutComplete";

type AppScreen = "setup" | "active" | "complete";

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("setup");
  const [config, setConfig] = useState<WorkoutConfig | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [elapsed, setElapsed] = useState(0);

  function handleStart(cfg: WorkoutConfig) {
    const segs = generateSegments(cfg);
    setConfig(cfg);
    setSegments(segs);
    setStartTime(new Date());
    setElapsed(0);
    setScreen("active");
  }

  function handleComplete(elapsedSeconds: number) {
    setElapsed(elapsedSeconds);
    setScreen("complete");
  }

  function handleStop() {
    setScreen("complete");
  }

  function handleReset() {
    setConfig(null);
    setSegments([]);
    setScreen("setup");
  }

  if (screen === "active" && config && segments.length > 0) {
    return (
      <WorkoutDisplay
        config={config}
        segments={segments}
        startTime={startTime}
        onComplete={handleComplete}
        onStop={handleStop}
      />
    );
  }

  if (screen === "complete" && config) {
    return (
      <WorkoutComplete
        config={config}
        startTime={startTime}
        elapsed={elapsed}
        onReset={handleReset}
      />
    );
  }

  return <WorkoutSetup onStart={handleStart} />;
}
