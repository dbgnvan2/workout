# Workout Timer

A mobile-first interval training web app built with **Next.js 15 + TypeScript + Tailwind CSS**.
Deploys instantly to **Vercel** with zero configuration.

---

## Features

### Workout Modes
| Mode | Description |
|---|---|
| **Interval** | Alternates between low and high intensity each period |
| **Stairstep** | Steps up +1 intensity per interval (5 increments), cadence interpolated, then restarts |
| **Mixed** | Staircase up → peak hold → recovery, then repeats |

### Configuration
- **Total Time** — 5 to 120 minutes
- **Starting Intensity & Cadence** — baseline targets
- **Upper Intensity & Cadence** — peak targets
- **Interval Duration** — 1 to 4 minutes per segment

### Active Workout Screen
- **Start time** clock, **Elapsed** time, **Time Remaining**
- **Segment countdown** with phase-colored display (blue = low, orange = high, amber = step)
- **Countdown beeps** — short beep each of the last 10 seconds of every interval
- **Ding-a-ling bell** — two-tone synthesized bell when an interval completes
- **Triple bell** — plays on full workout completion
- **"Up Next"** preview of the next segment
- **Pause / Resume** button
- Visual pulse + red color change during final 10-second countdown

### Save & Load
- Save any workout configuration with one tap
- Up to 10 recent workouts stored locally (browser `localStorage`)
- Load any saved workout back into the setup form instantly
- Delete saved workouts individually

---

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS — dark theme, mobile-first
- **Audio**: Web Audio API — synthesized sounds, no external files
- **Storage**: `localStorage` — no backend required
- **Deployment**: [Vercel](https://vercel.com)

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone or browser.

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
3. Select `workout` → click **Deploy**

Vercel auto-detects Next.js — no configuration needed.

---

## Project Structure

```
workout/
├── app/
│   ├── layout.tsx          # PWA meta tags, mobile viewport, dark theme
│   ├── page.tsx            # Screen router: setup → active → complete
│   └── globals.css         # Tailwind base styles
├── components/
│   ├── WorkoutSetup.tsx    # Configuration form + save/load UI
│   ├── WorkoutDisplay.tsx  # Live workout timer with audio
│   └── WorkoutComplete.tsx # Summary screen
├── lib/
│   ├── workout.ts          # Segment generation logic for all 3 modes
│   ├── audio.ts            # Web Audio API: beep, bell, final bell
│   └── storage.ts          # localStorage save/load helpers
└── public/
    └── manifest.json       # PWA manifest for "Add to Home Screen"
```

---

## Audio

All sounds are **synthesized at runtime** using the Web Audio API — no audio files to host.

| Sound | Trigger |
|---|---|
| Short beep (880 Hz) | Each of the last 10 seconds of an interval |
| Ding-a-ling bell (A5 + C6) | Interval completed |
| Triple bell | Workout complete |

> **Note:** On iOS/Safari, audio is unlocked automatically when you tap **Start Workout**.

---

## Segment Generation

### Interval
```
Low → High → Low → High → … (each for intervalDuration minutes)
```

### Stairstep
```
Step 1 (start) → Step 2 (+1) → … → Step 6 (+5) → restart from Step 1
Cadence linearly interpolated between start and upper values.
```

### Mixed
```
[Build 1→6 staircase] → [Peak Hold] → [Recovery] → repeat
```
