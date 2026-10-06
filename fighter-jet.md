# Game Design Document: Sky Force Reloaded (Recreation)

## 1. Executive Summary & Vision

* **Project Name:** Fighter Jet Reloaded
* **Genre:** Top-down Vertical Shoot 'Em Up (Shmup)
* **Target Audience:** Retro arcade fans, nostalgic Symbian OS gamers, and arcade shooter enthusiasts.
* **Core Loop:** Fly mission → Destroy enemies & rescue pilots → Collect stars → Upgrade aircraft stats & weapons → Complete optional stage objectives → Unlock higher difficulty levels & new stages.

---

## 2. Technical Architecture & Tech Stack

```
+------------------------------------------------------------------+
|                          HTML5 DOM / CSS                         |
|  +------------------------------------------------------------+  |
|  | Tailwind CSS UI (Menus, HUD, Dialogue, Upgrades, Store)    |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
|                     Phaser 3.80+ Canvas Context                  |
|  +--------------------------+  +------------------------------+  |
|  | Gameplay Scene           |  | Background Parallax Manager |  |
|  | (Sprites, Physics, Pools)|  | (TileSprite & Particle FX)   |  |
|  +--------------------------+  +------------------------------+  |
+------------------------------------------------------------------+
|                    Engine & Audio Subsystems                     |
|  +--------------------------+  +------------------------------+  |
|  | Howler.js Audio Engine   |  | GameStore.ts / LocalStorage  |  |
|  | (BGM/SFX Crossfading)    |  | (State Hydration & Saves)    |  |
|  +--------------------------+  +------------------------------+  |
+------------------------------------------------------------------+

```

### Stack Breakdown

* **Engine:** Phaser 3.80+ (TypeScript / ES6 Modules)
* **UI & Dialogue Layer:** HTML5 Canvas Overlay with Tailwind CSS for sharp UI panels, vector portraits, and clear text rendering.
* **Audio Engine:** Howler.js (dynamic BGM cross-fading and pooled sound effects).
* **State Management:** `GameStore.ts` (Reactive state store backed by LocalStorage serialization).
* **Build Tool:** Vite + Node.js.

---

## 3. Core Mechanics & Controls

### Controls Map

* **Keyboard/Mouse (PC):**
* `W / A / S / D` or `Arrow Keys`: Ship Movement
* `Spacebar` or `Left Click`: Fire Primary Cannon
* `1` / `2` / `3`: Activate Power-ups (Laser / Shield / Mega Bomb)
* `P` or `Esc`: Pause Game


* **Touch Controls (Mobile/Tablet):**
* **Relative Touch Drag:** Ship smoothly follows finger offset to prevent finger obstruction.



### Core Systems

* **Health System:** Armor bar with directional hit feedback.
* **Power-Up Slots:**
* **Laser Beam:** High-damage linear penetration beam.
* **Energy Shield:** Temporary invulnerability + ramming damage.
* **Mega Bomb:** Screen-clearing explosive radius.
* **Magnet:** Auto-attracts nearby stars and collectibles.


* **Rescue Mechanic:** Hover over stranded human hostages for 2 seconds to rescue them for bonus stars and stage medals.

---

## 4. Game Systems & Progression (`GameStore.ts`)

```typescript
// Core Data Schema for GameStore.ts
export interface PlayerUpgrades {
  mainCannonLevel: number;    // Max 10
  wingCannonsLevel: number;   // Max 10
  magnetRadiusLevel: number;  // Max 5
  healthArmorLevel: number;   // Max 10
  missileLauncherLevel: number; // Max 5
  laserCount: number;
  shieldCount: number;
  bombCount: number;
}

export interface StageData {
  id: number;
  unlocked: boolean;
  highScore: number;
  medals: {
    destroy70Percent: boolean;
    destroy100Percent: boolean;
    rescueAllHumans: boolean;
    untouched: boolean;
  };
}

export interface GameState {
  stars: number;
  upgrades: PlayerUpgrades;
  stages: StageData[];
}

```

### Upgrade Matrix

* **Main Cannon:** Fire rate and damage increases.
* **Wing Cannons:** Adds wide-spread side projectiles.
* **Magnet:** Expands star attraction radius.
* **Health Armor:** Increases hit points and hull resilience.
* **Missile Launcher:** Periodically launches homing missiles.

---

## 5. Level & Wave Architecture

### Stage Structure (8 Stages Planned)

Each stage features 3 scrolling layers with parallax depth:

1. **Foreground Layer:** Floating clouds, smoke, low-altitude debris.
2. **Action Layer:** Player ship, enemy units, bullet pools, hostages, and stars.
3. **Background Layer:** Ocean, landmass, military bases, bridges (TileSprites with continuous dynamic scrolling offset).

### Objective Medals (Per Stage)

1. **Destroy 70%** of enemy forces.
2. **Destroy 100%** of enemy forces.
3. **Rescue all hostages.**
4. **Finish undamaged** (Untouched Medal).

---

## 6. Enemy & Boss Design

### Regular Units

* **Scout Jet:** Weak, high speed, straight-line flight paths.
* **Turret (Ground):** Stationary, aims directly at player position.
* **Heavy Chopper:** High HP, fires 3-bullet fan spreads.
* **Tank (Ground):** Moves along predetermined bridge/road paths, fires explosive shells.

### Boss Archetypes (End-of-Stage)

* **Stage 1 Boss: Heavy Gunship**
* *Phase 1:* Dual Gatling guns targeting player location.
* *Phase 2:* Wings detach; fires rotating missile barrages and sweeping lasers.


* **Stage 2 Boss: Fortress Tank**
* *Phase 1:* Front-facing armor shields; mortar strikes on player screen region.
* *Phase 2:* Core exposure; intense bullet-hell ring patterns.



---

## 7. User Interface (Tailwind CSS Overlay)

The UI layer runs on an HTML overlay above the Phaser canvas to keep vector assets sharp and responsive.

```
+-------------------------------------------------------------------+
| [HUD Overlay]                                                     |
| HP: [████████--]  Stars: 🌟 1,240   Score: 45,200  [|| Pause]    |
+-------------------------------------------------------------------+
|                                                                   |
|                      PHASER CANVAS VIEWPORT                       |
|                                                                   |
+-------------------------------------------------------------------+
| [Ability Hotbar]                                                  |
| [ 1: Laser (2) ]        [ 2: Shield (1) ]       [ 3: Bomb (0) ]   |
+-------------------------------------------------------------------+

```

### Key UI Screens

1. **Main Menu:** Stage Selection Grid, Hangar Access, Settings.
2. **Hangar (Upgrade Shop):** Interactive ship overview with star balance and upgrade trees.
3. **Dialogue Popups:** Vector character portraits for mission briefs and boss pre-fight interactions.
4. **Post-Mission Summary:** Detailed breakdown of stars gathered, medals earned, and total score.

---

## 8. Audio System Design (Howler.js)

### Audio Channels

* **BGM Channel:**
* Cross-fades dynamically based on gameplay states (e.g., transitions smoothly from ambient exploration track to intense boss track).


* **SFX Channel:**
* Uses Howler audio sprites for performance and low latency.
* Pooled sounds for lasers, explosions, star pickups, and warnings.



---

## 9. Development Phases & Roadmap

### Phase 1: Prototype Engine Setup

* Vite + TypeScript project setup.
* Phaser 3.80 integration with player movement, shooting, and basic pooling systems.

### Phase 2: Core Gameplay Mechanics

* Enemy wave spawner, collision handling, star drops, and human rescue zones.
* Parallax background scrolling system.

### Phase 3: State & UI Systems

* `GameStore.ts` implementation with LocalStorage serialization.
* Tailwind CSS UI overlay (Hangar, HUD, Dialogue, Victory screens).

### Phase 4: Audio & Polish

* Howler.js integration for dynamic BGM fading and SFX.
* Screen shake, particle effects (explosions, engine trails), and boss encounters.

---
