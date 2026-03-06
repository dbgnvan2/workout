import type { WorkoutConfig } from "./workout";

export interface SavedWorkout {
  id: string;
  name: string;
  savedAt: string; // ISO-8601
  config: WorkoutConfig;
}

const KEY = "workout_saved_v1";
// Monotonic counter ensures unique IDs even when called within the same millisecond
let _idSeq = 0;

export function getSavedWorkouts(): SavedWorkout[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedWorkout[];
  } catch {
    return [];
  }
}

/** Saves config and returns the new SavedWorkout entry */
export function saveWorkout(config: WorkoutConfig, customName?: string): SavedWorkout {
  const list = getSavedWorkouts();
  const label =
    config.sequenceType.charAt(0).toUpperCase() + config.sequenceType.slice(1);
  const entry: SavedWorkout = {
    id: `${Date.now()}-${++_idSeq}`,
    name: customName ?? `${label} · ${config.totalTime} min`,
    savedAt: new Date().toISOString(),
    config,
  };
  localStorage.setItem(KEY, JSON.stringify([entry, ...list].slice(0, 10)));
  return entry;
}

export function deleteWorkout(id: string): void {
  const updated = getSavedWorkouts().filter((w) => w.id !== id);
  localStorage.setItem(KEY, JSON.stringify(updated));
}

/** Friendly short date: "Mar 5, 9:30 AM" */
export function formatSavedDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
