# 🛠️ Parkour Hero – Architecture & Technical Documentation

This document outlines the architectural patterns, data flow, subsystem lifecycles, and rendering pipelines powering *Parkour Hero*.

---

## 🏛️ 1. High-Level Architecture Overview

Parkour Hero is built without third-party game engines. It utilizes a **data-oriented Entity-Component-System (ECS)** architecture, a **Fixed-Timestep Physics Loop with Linear Interpolation (Lerp)**, a **Spatial Hash Grid** for collision partitioning, and a **Batch Instanced WebGL2 Renderer**.

                   +------------------------+
                   |  Browser Event Loop    |
                   +-----------+------------+
                               |
                               v
                     [ Engine.gameLoop() ]
                               |
        +----------------------+----------------------+
        | (Fixed Physics Step: 60Hz)                  | (Variable Render Step)
        v                                             v
 [ InputSystem ]                                [ Camera.apply() ]
        |                                             |
 [ PlayerStateSystem (FSM) ]                    [ Renderer (WebGL2 Instancing) ]
        |                                             |
 [ MovementSystem ]                             [ ParticleSystemWebGL ]
        |                                             |
 [ CollisionSystem (SpatialGrid) ]              [ HUD (2D Canvas + Bitmaps) ]
        |                                             |
 [ Combat & Gameplay Systems ]                  [ UI System (Lit Components) ]
        |                                             |
 [ PlayerLifecycleSystem ]                            v
        +----------------------------------------> Screen

---

## 🧩 2. Core Subsystems

### 2.1 Entity-Component-System (`src/core/entity-manager.js`)
* **Entities**: Simple unique numerical IDs (`0, 1, 2, ...`). An array of recycled IDs (`freeEntities`) avoids memory reallocation.
* **Components**: Plain data classes (no logic) holding state (e.g., `PositionComponent`, `VelocityComponent`, `CollisionComponent`).
* **Bitmask Indexing**: Each component class is assigned a unique bit (`1 << n`). Entities possess an integer mask (`entityMasks[id]`). Querying entities with `[PositionComponent, VelocityComponent]` performs bitwise `AND` checks cached in a `queryCache` map.

### 2.2 Game Loop & Timestep (`src/core/engine.js`)
* **Fixed Delta Time**: `FIXED_DT = 1 / 60` (16.66ms).
* **Accumulator Pattern**: Prevents simulation speed discrepancies across 60Hz, 120Hz, and 144Hz monitors.
* **State Interpolation**: `PreviousPositionComponent` records the prior frame's transform. The renderer blends between past and current position using `alpha = accumulator / targetDt` to eliminate visual micro-stuttering.

### 2.3 Collision & Spatial Partitioning (`src/systems/collision-system.js`, `src/utils/spatial-grid.js`)
* **Spatial Hash Grid**: World space is partitioned into 32px buckets. Only entities in identical or adjacent cells evaluate AABB bounding checks ($O(1)$ average query time).
* **Collision Resolution**: Axis-aligned sweep collision. X-axis movement is processed and resolved first; Y-axis movement is processed second.
* **Ground Verification**: Uses a sub-pixel 1-pixel probe box directly beneath the player hitbox to prevent floating-point rounding state jitter.

### 2.4 Player Finite State Machine (FSM) (`src/systems/player-state-system.js`, `src/states/player/*`)
* Encapsulates behavioral states (`SpawnState`, `IdleState`, `RunState`, `JumpState`, `DoubleJumpState`, `DashState`, `ClingState`, `FallState`, `HitState`, `DespawnState`).
* Each state handles input evaluation and returns the next state instance or `null`.

### 2.5 WebGL2 Instanced Renderer (`src/systems/renderer.js`, `src/core/gl-utils.js`)
* **Runtime Texture Atlas**: `TextureAtlas` class blits individual asset sprites into a dynamic 2048x2048 texture sheet on startup, eliminating texture swap pipeline flushes.
* **Instanced Batching**: Instead of quad-by-quad draws, instance attributes (Position, Size, UV Coordinates, Alpha, Rotation, Tint) are written to a single Float32 buffer and submitted in one call via `gl.drawArraysInstanced()`.

### 2.6 Decoupled Event System (`src/utils/event-bus.js`)
* Global Pub/Sub bus (`eventBus`) decoupling simulation systems from audio (`SoundManager`), UI overlays (`Lit` modals), and visual effects (`EffectsSystem`).

---

## 📂 3. Directory Structure

src/
├── components/          # ECS Data-only components
├── core/                # Engine loop, Entity Manager, Camera, WebGL utilities
├── editor/              # Built-in Tile & Level Editor tool suite
├── entities/            # Entity factories, tile definitions, level configs
├── managers/            # Asset loading, Game state persistence, Audio
├── shaders/             # GLSL Vertex & Fragment shaders (WebGL2)
├── states/player/       # State Pattern classes for Player FSM
├── systems/             # ECS Logic systems (Physics, Collision, Combat, Rendering)
├── traps/               # Trap entity classes and procedural behavior
├── ui/                  # Lit web-component HUD, Modals, and Font rendering
└── utils/               # Constants, EventBus, Spatial Grid data structures