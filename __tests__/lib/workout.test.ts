import {
  generateSegments,
  formatTime,
  formatClockTime,
  WorkoutConfig,
  Segment,
} from "@/lib/workout";

// ── Shared fixture ────────────────────────────────────────────────────────
const base: WorkoutConfig = {
  totalTime: 10,         // 600 s
  startIntensity: 5,
  startCadence: 80,
  upperIntensity: 10,
  upperCadence: 100,
  intervalDuration: 2,   // 120 s per segment
  sequenceType: "interval",
};

function totalSecs(segs: Segment[]) {
  return segs.reduce((sum, s) => sum + s.duration, 0);
}

// ── formatTime ────────────────────────────────────────────────────────────
describe("formatTime", () => {
  it("formats zero as 00:00", () => expect(formatTime(0)).toBe("00:00"));
  it("formats 65 s as 01:05", () => expect(formatTime(65)).toBe("01:05"));
  it("formats 3600 s as 1:00:00", () => expect(formatTime(3600)).toBe("1:00:00"));
  it("formats 3665 s as 1:01:05", () => expect(formatTime(3665)).toBe("1:01:05"));
  it("clamps negative numbers to 00:00", () => expect(formatTime(-30)).toBe("00:00"));
  it("floors fractional seconds", () => expect(formatTime(59.9)).toBe("00:59"));
});

// ── formatClockTime ───────────────────────────────────────────────────────
describe("formatClockTime", () => {
  it("returns a non-empty string for any Date", () => {
    const result = formatClockTime(new Date("2026-03-05T09:30:00"));
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── Interval segments ────────────────────────────────────────────────────
describe("generateSegments — interval", () => {
  const segs = generateSegments(base);

  it("total duration equals totalTime × 60", () =>
    expect(totalSecs(segs)).toBe(base.totalTime * 60));

  it("generates 5 segments for 10 min ÷ 2 min", () =>
    expect(segs).toHaveLength(5));

  it("first segment is low phase", () =>
    expect(segs[0].phase).toBe("low"));

  it("alternates low → high → low", () => {
    expect(segs[0].phase).toBe("low");
    expect(segs[1].phase).toBe("high");
    expect(segs[2].phase).toBe("low");
    expect(segs[3].phase).toBe("high");
  });

  it("low segments use start intensity and cadence", () => {
    segs
      .filter((s) => s.phase === "low")
      .forEach((s) => {
        expect(s.intensity).toBe(base.startIntensity);
        expect(s.cadence).toBe(base.startCadence);
      });
  });

  it("high segments use upper intensity and cadence", () => {
    segs
      .filter((s) => s.phase === "high")
      .forEach((s) => {
        expect(s.intensity).toBe(base.upperIntensity);
        expect(s.cadence).toBe(base.upperCadence);
      });
  });

  it("all segment durations are positive", () =>
    segs.forEach((s) => expect(s.duration).toBeGreaterThan(0)));

  it("last segment absorbs any remainder (odd total time)", () => {
    const cfg: WorkoutConfig = { ...base, totalTime: 7, intervalDuration: 3 };
    const s = generateSegments(cfg);
    expect(totalSecs(s)).toBe(420);
  });

  it("every segment has a non-empty label", () =>
    segs.forEach((s) => expect(s.label.length).toBeGreaterThan(0)));
});

// ── Stairstep segments ───────────────────────────────────────────────────
describe("generateSegments — stairstep", () => {
  const cfg: WorkoutConfig = {
    ...base,
    totalTime: 12, // 720 s = exactly 6 segments of 120 s
    sequenceType: "stairstep",
  };
  const segs = generateSegments(cfg);

  it("total duration equals totalTime × 60", () =>
    expect(totalSecs(segs)).toBe(cfg.totalTime * 60));

  it("generates 6 segments for 12 min ÷ 2 min", () =>
    expect(segs).toHaveLength(6));

  it("all segments have phase 'step'", () =>
    segs.forEach((s) => expect(s.phase).toBe("step")));

  it("first segment starts at startIntensity", () =>
    expect(segs[0].intensity).toBe(cfg.startIntensity));

  it("sixth segment reaches startIntensity + 5", () =>
    expect(segs[5].intensity).toBe(cfg.startIntensity + 5));

  it("intensity increases by 1 each step", () => {
    for (let i = 1; i < segs.length; i++) {
      expect(segs[i].intensity).toBe(segs[i - 1].intensity + 1);
    }
  });

  it("intensity never exceeds upperIntensity", () =>
    segs.forEach((s) =>
      expect(s.intensity).toBeLessThanOrEqual(cfg.upperIntensity)
    ));

  it("cadence starts at startCadence and ends at upperCadence", () => {
    expect(segs[0].cadence).toBe(cfg.startCadence);
    expect(segs[5].cadence).toBe(cfg.upperCadence);
  });

  it("restarts from base after 6 steps", () => {
    const cfg2: WorkoutConfig = {
      ...cfg,
      totalTime: 24, // 12 steps = two full cycles
    };
    const s = generateSegments(cfg2);
    // Steps 0 and 6 should both be at startIntensity
    expect(s[0].intensity).toBe(cfg2.startIntensity);
    expect(s[6].intensity).toBe(cfg2.startIntensity);
  });
});

// ── Mixed segments ───────────────────────────────────────────────────────
describe("generateSegments — mixed", () => {
  const cfg: WorkoutConfig = {
    ...base,
    totalTime: 20, // 1200 s
    sequenceType: "mixed",
  };
  const segs = generateSegments(cfg);

  it("total duration equals totalTime × 60", () =>
    expect(totalSecs(segs)).toBe(cfg.totalTime * 60));

  it("contains step, high, and low phases", () => {
    const phases = new Set(segs.map((s) => s.phase));
    expect(phases.has("step")).toBe(true);
    expect(phases.has("high")).toBe(true);
    expect(phases.has("low")).toBe(true);
  });

  it("all segment durations are positive", () =>
    segs.forEach((s) => expect(s.duration).toBeGreaterThan(0)));

  it("intensity stays within [startIntensity, upperIntensity]", () =>
    segs.forEach((s) => {
      expect(s.intensity).toBeGreaterThanOrEqual(cfg.startIntensity);
      expect(s.intensity).toBeLessThanOrEqual(cfg.upperIntensity);
    }));

  it("cadence stays within [startCadence, upperCadence]", () =>
    segs.forEach((s) => {
      expect(s.cadence).toBeGreaterThanOrEqual(cfg.startCadence);
      expect(s.cadence).toBeLessThanOrEqual(cfg.upperCadence);
    }));
});

// ── Edge cases ───────────────────────────────────────────────────────────
describe("generateSegments — edge cases", () => {
  it("minimum total time (5 min) produces segments", () => {
    const cfg: WorkoutConfig = { ...base, totalTime: 5 };
    expect(generateSegments(cfg).length).toBeGreaterThan(0);
  });

  it("maximum interval duration (4 min) is handled", () => {
    const cfg: WorkoutConfig = { ...base, intervalDuration: 4, totalTime: 20 };
    const segs = generateSegments(cfg);
    expect(totalSecs(segs)).toBe(20 * 60);
  });

  it("single-segment workout when interval >= totalTime", () => {
    const cfg: WorkoutConfig = { ...base, intervalDuration: 4, totalTime: 4 };
    const segs = generateSegments(cfg);
    expect(segs).toHaveLength(1);
    expect(segs[0].duration).toBe(240);
  });
});
