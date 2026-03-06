import {
  getSavedWorkouts,
  saveWorkout,
  deleteWorkout,
  formatSavedDate,
  SavedWorkout,
} from "@/lib/storage";
import { WorkoutConfig } from "@/lib/workout";

const mockConfig: WorkoutConfig = {
  totalTime: 30,
  startIntensity: 5,
  startCadence: 80,
  upperIntensity: 10,
  upperCadence: 95,
  intervalDuration: 2,
  sequenceType: "interval",
};

beforeEach(() => {
  localStorage.clear();
});

// ── getSavedWorkouts ──────────────────────────────────────────────────────
describe("getSavedWorkouts", () => {
  it("returns an empty array when nothing is saved", () => {
    expect(getSavedWorkouts()).toEqual([]);
  });

  it("returns an empty array when localStorage has corrupt JSON", () => {
    localStorage.setItem("workout_saved_v1", "not-json{{{");
    expect(getSavedWorkouts()).toEqual([]);
  });

  it("returns an empty array when localStorage has empty string", () => {
    localStorage.setItem("workout_saved_v1", "");
    expect(getSavedWorkouts()).toEqual([]);
  });
});

// ── saveWorkout ───────────────────────────────────────────────────────────
describe("saveWorkout", () => {
  it("saves and retrieves one workout", () => {
    const entry = saveWorkout(mockConfig);
    const list = getSavedWorkouts();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(entry.id);
  });

  it("persists the full config", () => {
    saveWorkout(mockConfig);
    const [saved] = getSavedWorkouts();
    expect(saved.config).toEqual(mockConfig);
  });

  it("auto-generates name from sequenceType and totalTime", () => {
    const entry = saveWorkout(mockConfig);
    expect(entry.name).toBe("Interval · 30 min");
  });

  it("capitalises sequence type in auto-name", () => {
    expect(saveWorkout({ ...mockConfig, sequenceType: "stairstep" }).name).toBe(
      "Stairstep · 30 min"
    );
    expect(saveWorkout({ ...mockConfig, sequenceType: "mixed" }).name).toBe(
      "Mixed · 30 min"
    );
  });

  it("uses a custom name when provided", () => {
    const entry = saveWorkout(mockConfig, "My Race Prep");
    expect(entry.name).toBe("My Race Prep");
  });

  it("assigns a unique string id", () => {
    const a = saveWorkout(mockConfig);
    const b = saveWorkout(mockConfig);
    expect(typeof a.id).toBe("string");
    expect(a.id).not.toBe(b.id);
  });

  it("stores a valid ISO savedAt date", () => {
    const entry = saveWorkout(mockConfig);
    expect(() => new Date(entry.savedAt)).not.toThrow();
    expect(new Date(entry.savedAt).toISOString()).toBe(entry.savedAt);
  });

  it("prepends newer workouts so the list is newest-first", () => {
    const a = saveWorkout({ ...mockConfig, totalTime: 20 });
    const b = saveWorkout({ ...mockConfig, totalTime: 45 });
    const list = getSavedWorkouts();
    expect(list[0].id).toBe(b.id);
    expect(list[1].id).toBe(a.id);
  });

  it("caps the list at 10 entries", () => {
    for (let i = 0; i < 13; i++) {
      saveWorkout({ ...mockConfig, totalTime: 10 + i });
    }
    expect(getSavedWorkouts()).toHaveLength(10);
  });

  it("keeps the 10 most-recent entries after cap", () => {
    // Save 13 — the first 3 should be evicted
    const ids: string[] = [];
    for (let i = 0; i < 13; i++) {
      ids.push(saveWorkout({ ...mockConfig, totalTime: 10 + i }).id);
    }
    const stored = getSavedWorkouts().map((w) => w.id);
    // The last 10 saved (ids[3]…ids[12]) should be kept; ids[0-2] evicted
    expect(stored).not.toContain(ids[0]);
    expect(stored).not.toContain(ids[1]);
    expect(stored).not.toContain(ids[2]);
    expect(stored).toContain(ids[12]);
  });
});

// ── deleteWorkout ─────────────────────────────────────────────────────────
describe("deleteWorkout", () => {
  it("removes the workout with the given id", () => {
    const entry = saveWorkout(mockConfig);
    deleteWorkout(entry.id);
    expect(getSavedWorkouts()).toHaveLength(0);
  });

  it("only removes the targeted workout", () => {
    const a = saveWorkout({ ...mockConfig, totalTime: 20 });
    const b = saveWorkout({ ...mockConfig, totalTime: 30 });
    deleteWorkout(a.id);
    const list = getSavedWorkouts();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(b.id);
  });

  it("is a no-op for a non-existent id", () => {
    saveWorkout(mockConfig);
    deleteWorkout("does-not-exist");
    expect(getSavedWorkouts()).toHaveLength(1);
  });

  it("leaves an empty list after deleting the last entry", () => {
    const entry = saveWorkout(mockConfig);
    deleteWorkout(entry.id);
    expect(getSavedWorkouts()).toEqual([]);
  });
});

// ── formatSavedDate ───────────────────────────────────────────────────────
describe("formatSavedDate", () => {
  it("returns a non-empty string", () => {
    const result = formatSavedDate(new Date().toISOString());
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles an arbitrary past ISO date without throwing", () => {
    expect(() => formatSavedDate("2020-01-15T08:30:00.000Z")).not.toThrow();
  });
});
