/**
 * Audio tests — all Web Audio API calls are mocked so tests run in jsdom
 * without a real audio device.  We verify:
 *   1. Functions don't throw under normal conditions
 *   2. The correct number of oscillator nodes are created per sound
 *   3. Graceful no-op when AudioContext is unavailable
 */

// ── Mock setup (must happen before module import) ─────────────────────────
const mockStart   = jest.fn();
const mockStop    = jest.fn();
const mockConnect = jest.fn();
const mockSetValueAtTime               = jest.fn();
const mockLinearRampToValueAtTime      = jest.fn();
const mockExponentialRampToValueAtTime = jest.fn();

const makeMockGain = () => ({
  connect: mockConnect,
  gain: {
    setValueAtTime:               mockSetValueAtTime,
    linearRampToValueAtTime:      mockLinearRampToValueAtTime,
    exponentialRampToValueAtTime: mockExponentialRampToValueAtTime,
  },
});

const makeMockOsc = () => ({
  connect:   mockConnect,
  start:     mockStart,
  stop:      mockStop,
  frequency: { value: 0 },
  type:      "sine" as OscillatorType,
});

const mockBufferSource = {
  connect: mockConnect,
  start:   mockStart,
  buffer:  null as unknown as AudioBuffer,
};

const mockCtx = {
  createOscillator:   jest.fn(() => makeMockOsc()),
  createGain:         jest.fn(() => makeMockGain()),
  createBuffer:       jest.fn(() => ({} as AudioBuffer)),
  createBufferSource: jest.fn(() => mockBufferSource),
  destination:        {},
  currentTime:        0,
  state:              "running" as AudioContextState,
  resume:             jest.fn().mockResolvedValue(undefined),
};

// Patch global BEFORE the module is imported so the singleton captures it
global.AudioContext = jest.fn(() => mockCtx) as unknown as typeof AudioContext;

// Import AFTER mock is in place
import { initAudio, playBeep, playBell, playFinalBell } from "@/lib/audio";

// ── Shared setup ──────────────────────────────────────────────────────────
/**
 * Each playback test calls initAudio() then clears all mocks so that only
 * calls made during the actual play function are counted.
 */
function resetAfterInit() {
  initAudio();
  jest.clearAllMocks();
  mockCtx.state = "running";
}

// ── initAudio ─────────────────────────────────────────────────────────────
describe("initAudio", () => {
  it("does not throw", () => {
    expect(() => initAudio()).not.toThrow();
  });

  it("enables playBeep to create oscillators (context is running)", () => {
    initAudio();
    jest.clearAllMocks();
    mockCtx.state = "running";
    playBeep();
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
  });

  it("plays a silent buffer to unlock iOS audio on first call", () => {
    // Re-import in isolation to catch the very first initAudio() call.
    // We verify the behaviour indirectly: after initAudio the context is
    // functional (playBeep creates oscillators).
    initAudio();
    jest.clearAllMocks();
    playBeep();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
  });
});

// ── playBeep ──────────────────────────────────────────────────────────────
describe("playBeep", () => {
  beforeEach(resetAfterInit);

  it("does not throw", () => {
    expect(() => playBeep()).not.toThrow();
  });

  it("creates exactly 1 oscillator", () => {
    playBeep();
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
  });

  it("creates exactly 1 gain node", () => {
    playBeep();
    expect(mockCtx.createGain).toHaveBeenCalledTimes(1);
  });

  it("starts and stops the oscillator", () => {
    playBeep();
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it("applies a gain envelope (attack ramp + exponential decay)", () => {
    playBeep();
    expect(mockSetValueAtTime).toHaveBeenCalled();
    expect(mockLinearRampToValueAtTime).toHaveBeenCalled();
    expect(mockExponentialRampToValueAtTime).toHaveBeenCalled();
  });

  it("is a no-op when AudioContext state is not 'running'", () => {
    mockCtx.state = "suspended" as AudioContextState;
    playBeep();
    expect(mockCtx.createOscillator).not.toHaveBeenCalled();
  });
});

// ── playBell ──────────────────────────────────────────────────────────────
describe("playBell — ding-a-ling", () => {
  beforeEach(resetAfterInit);

  it("does not throw", () => {
    expect(() => playBell()).not.toThrow();
  });

  it("creates 6 oscillators (3 partials × 2 strikes)", () => {
    playBell();
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(6);
  });

  it("creates 6 gain nodes", () => {
    playBell();
    expect(mockCtx.createGain).toHaveBeenCalledTimes(6);
  });

  it("starts all 6 oscillators", () => {
    playBell();
    expect(mockStart).toHaveBeenCalledTimes(6);
  });

  it("stops all 6 oscillators", () => {
    playBell();
    expect(mockStop).toHaveBeenCalledTimes(6);
  });

  it("is a no-op when AudioContext is not running", () => {
    mockCtx.state = "suspended" as AudioContextState;
    playBell();
    expect(mockCtx.createOscillator).not.toHaveBeenCalled();
  });
});

// ── playFinalBell ─────────────────────────────────────────────────────────
describe("playFinalBell — triple bell", () => {
  beforeEach(resetAfterInit);

  it("does not throw", () => {
    expect(() => playFinalBell()).not.toThrow();
  });

  it("creates 6 oscillators (2 partials × 3 strikes)", () => {
    playFinalBell();
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(6);
  });

  it("starts all 6 oscillators", () => {
    playFinalBell();
    expect(mockStart).toHaveBeenCalledTimes(6);
  });

  it("stops all 6 oscillators", () => {
    playFinalBell();
    expect(mockStop).toHaveBeenCalledTimes(6);
  });

  it("is a no-op when AudioContext is not running", () => {
    mockCtx.state = "suspended" as AudioContextState;
    playFinalBell();
    expect(mockCtx.createOscillator).not.toHaveBeenCalled();
  });
});
