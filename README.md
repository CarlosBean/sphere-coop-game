# Sphere Coop Game

A real-time multiplayer browser game where up to 4 players navigate a randomly generated maze as spheres, racing to reach the center goal. Built with **Phaser 3**, **Socket.IO**, and **TypeScript** in a monorepo architecture.

## Live Demo

| Service | URL |
|---|---|
| Game (client) | https://sphere-coop-game.pages.dev |
| Server | https://sphere-coop-server.fly.dev |

---

## Gameplay

- **1–4 players** join a room using a shared code
- Each session generates a **unique random maze** (DFS recursive backtracker, 19×11 grid)
- Players spawn at the **four corners** of the maze
- The goal is a **pulsing gold circle** at the center of the maze
- The **first player to reach the center wins** — their name and time are displayed
- The lobby returns to the menu automatically after 5 seconds

### Controls

| Key | Action |
|---|---|
| `↑` / `W` | Move up |
| `↓` / `S` | Move down |
| `←` / `A` | Move left |
| `→` / `D` | Move right |

---

## Architecture

```
Browser ──── WebSocket ────▶ Fly.io (Node.js server, port 3001)
    │                              │
Cloudflare Pages                Socket.IO
(static client)               20 Hz game loop
                            server-authoritative state
```

### Monorepo structure

```
sphere-coop-game/
├── packages/
│   ├── shared/          # Types, constants, and event names shared by client & server
│   ├── server/          # Node.js + Socket.IO game server
│   └── client/          # Phaser 3 browser client (built by Vite)
├── vitest.config.ts     # Root test configuration
└── package.json         # npm workspaces root
```

### Package responsibilities

| Package | Tech | Role |
|---|---|---|
| `@sphere-coop/shared` | TypeScript | Shared types (`PlayerState`, `GameState`, `WallSegment`…), constants, event names |
| `@sphere-coop/server` | Node.js, Socket.IO, tsx | Room management, authoritative game loop, maze generation, physics |
| `@sphere-coop/client` | Phaser 3, Vite | Rendering, input handling, client-side interpolation |

---

## Technical Design

### Server-authoritative game loop

- Runs at **20 Hz** (50 ms/tick) using `setInterval`
- Each tick: applies player input → steps physics → resolves collisions → checks win → broadcasts state
- **No database** — all state is in memory per room

### Maze generation

- **Iterative DFS recursive backtracker** on a 19×11 cell grid
- Produces a **perfect maze** (fully connected, no loops) with a unique layout every session
- Walls are sent to all clients within the first 2 seconds of the game (first 40 ticks) to survive network latency and browser tab throttling
- Encoded as `WallSegment[]` (axis-aligned line segments)

### Physics

- **Circle–segment collision**: closest-point-on-segment geometry pushes players out of walls and cancels the inward velocity component
- **Player–player collision**: overlap resolution with symmetric push-out
- **Friction**: velocity multiplied by `0.82` each tick for responsive, snappy feel
- **World boundary clamp** as a final safety net

### Client prediction & interpolation

- **Local player**: input is sent to the server every tick; position is reconciled with server state each frame
- **Remote players**: positions are interpolated between received server states for smooth rendering despite the 50 ms tick interval

### Socket.IO event flow

```
Client                          Server
  │── room:create / room:join ──▶│
  │◀── room:created / room:joined │
  │◀── lobby:update ─────────────│
  │── game:start ───────────────▶│
  │◀── game:starting (3,2,1,0) ──│  (1s countdown)
  │◀── game:stateUpdate (20 Hz) ─│  (tick 1–40 include walls)
  │── player:input (20 Hz) ──────▶│
  │◀── game:over ─────────────────│  (winner data)
```

---

## Development

### Prerequisites

- Node.js 20+
- npm 9+

### Setup

```bash
git clone https://github.com/CarlosBean/sphere-coop-game.git
cd sphere-coop-game
npm install
```

### Running locally

```bash
# Terminal 1 — game server (port 3001)
npm run dev:server

# Terminal 2 — client dev server (port 5173)
npm run dev:client
```

Open http://localhost:5173 in two browser tabs to test multiplayer locally.

### Building

```bash
npm run build:shared   # compile shared types
npm run build:server   # compile server to dist/
npm run build:client   # compile & bundle client to dist/
```

### Testing

```bash
npm test               # run all tests once
npm run test:watch     # watch mode
npm run test:coverage  # with coverage report
```

**86 tests across 5 files** — all server-side logic is unit tested:

| File | Coverage |
|---|---|
| `game.constants.test.ts` | Maze geometry invariants, spawn positions, goal coordinates |
| `MazeGenerator.test.ts` | Wall count (spanning-tree formula), full connectivity (BFS), border completeness, randomness |
| `Physics.test.ts` | Input normalization, friction, boundary clamping, wall push-out, player collision |
| `GameState.test.ts` | Tick counter, wall delivery window, snapshot immutability, win detection |
| `Room.test.ts` | Player capacity, host assignment & transfer, colorIndex uniqueness, `toRoomInfo` shape |

---

## Deployment

### Server — Fly.io

The server runs as a persistent, always-on Node.js process. `tsx` is used to run TypeScript source directly (the `shared` package exports raw `.ts` files).

```bash
# From the repo root
flyctl deploy --config packages/server/fly.toml --dockerfile packages/server/Dockerfile
```

Configuration (`packages/server/fly.toml`):
- Region: `iad` (US East)
- Memory: 256 MB shared VM
- **Single machine** (`max_machines_running = 1`) — required because game state is in memory; multiple machines would split state across instances

### Client — Cloudflare Pages

The client is a static Vite build deployed automatically on every push to `main`.

| Setting | Value |
|---|---|
| Build command | `npm run build:client` |
| Build output | `packages/client/dist` |
| Environment variable | `VITE_SERVER_URL=https://sphere-coop-server.fly.dev` |

The `VITE_SERVER_URL` variable is injected at build time by Vite. Falls back to `http://localhost:3001` when not set (local development).

---

## Project Constants

| Constant | Value | Description |
|---|---|---|
| `WORLD_WIDTH` | 1280 px | Canvas width |
| `WORLD_HEIGHT` | 720 px | Canvas height |
| `MAZE_COLS` | 19 | Maze grid columns |
| `MAZE_ROWS` | 11 | Maze grid rows |
| `MAZE_CELL_SIZE` | 64 px | Size of each maze cell |
| `SPHERE_RADIUS` | 10 px | Player circle radius |
| `PLAYER_SPEED` | 300 px/s | Max acceleration per tick |
| `FRICTION` | 0.82 | Velocity multiplier per tick |
| `TICK_RATE` | 20 Hz | Server update rate |
| `GOAL_X / GOAL_Y` | 640, 360 | Goal position (world center) |
| `GOAL_RADIUS` | 18 px | Win detection radius |
| `MAX_PLAYERS` | 4 | Maximum players per room |

---

## Repository

https://github.com/CarlosBean/sphere-coop-game
