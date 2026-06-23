# Drift Protocol

A physics-driven 3D browser drift racing game featuring a BMW M5 E34 on a dedicated stadium drift circuit.

## Play

Open `index.html` in any modern browser, or deploy to a static host.

**Live Demo:** [GitHub Pages](#) *(update this link after enabling Pages)*

## Controls

| Key | Action |
|-----|--------|
| W / ↑ | Throttle |
| S / ↓ | Brake / Reverse |
| A / ← | Steer Left |
| D / → | Steer Right |
| Space | Handbrake (initiate drift) |
| Esc | Pause |
| C | Cycle camera mode |

## Game Modes

- **Score Attack** — 90-second timer. Chain drifts, build multipliers, chase high scores.
- **Free Practice** — Unlimited time. No pressure, just feel the car.

## Scoring

| Drift Angle | Condition |
|-------------|-----------|
| >12° | Drift tracking begins |
| Time-based | Multiplier stacks (×0.5 per 2.5s) |
| High angle | Bonus multiplier |

## Tech Stack

- **Renderer:** [Three.js](https://threejs.org/) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- **Physics:** [@react-three/rapier](https://github.com/pmndrs/react-three-rapier) (Rapier WASM)
- **State:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Post-FX:** [@react-three/postprocessing](https://docs.pmnd.rs/react-postprocessing)
- **Build:** Vite + TypeScript

## Development

```bash
pnpm install
pnpm --filter @workspace/3d-game run dev
```

## Build for Production

```bash
pnpm --filter @workspace/3d-game run build
# Output: artifacts/3d-game/dist/
```

## Architecture

```
src/
├── store/         # Zustand game state (gameStore.ts)
├── game/          # R3F scene components
│   ├── Car.tsx        # BMW M5 E34 body + Rapier rigid body + drift physics
│   ├── Track.tsx      # Stadium oval with Rapier colliders
│   ├── Environment.tsx # Nighttime lighting, floodlights, skybox
│   ├── CameraController.tsx # Chase / cinematic camera modes
│   ├── DriftScorer.tsx      # Angle detection + multiplier + score
│   ├── SmokeSystem.tsx      # Particle tire smoke
│   └── SkidMarks.tsx        # Decal skid trails
└── ui/            # HUD, menus, end screen
```

## License

MIT — free to fork, mod, and race.
