import { TILE_DEFINITIONS } from './tile-definitions.js';
import { GRID_CONSTANTS } from '../utils/constants.js';

/**
 * Manages the level's static tile-based geometry and dynamic objects.
 * This class parses a grid-based level configuration and provides methods
 * for the engine to interact with the world.
 */
export class Level {
  constructor(levelConfig) {
    this.name = levelConfig.name || 'Unnamed Level';

    // Establish grid and world dimensions
    this.gridWidth = levelConfig.gridWidth;
    this.gridHeight = levelConfig.gridHeight;
    this.width = this.gridWidth * GRID_CONSTANTS.TILE_SIZE;
    this.height = this.gridHeight * GRID_CONSTANTS.TILE_SIZE;
    this.background = levelConfig.background || 'background_blue';
    this.backgroundScroll = levelConfig.backgroundScroll || { x: 0, y: 15 };

    // Convert player start position from grid units to world coordinates
    this.startPosition = {
      x: levelConfig.startPosition.x * GRID_CONSTANTS.TILE_SIZE,
      y: levelConfig.startPosition.y * GRID_CONSTANTS.TILE_SIZE,
    };

    this.tiles = levelConfig.layout.map(rowString =>
      [...rowString].map(tileId => TILE_DEFINITIONS[tileId] || TILE_DEFINITIONS['0'])
    );

    // Initialize arrays for all dynamic object types
    this.fruits = [];
    this.checkpoints = [];
    this.trampolines = [];
    this.spikes = [];
    this.fireTraps = [];
    this.trophy = null;

    (levelConfig.objects || []).forEach(obj => {
      const worldX = obj.x * GRID_CONSTANTS.TILE_SIZE;
      const worldY = obj.y * GRID_CONSTANTS.TILE_SIZE;

      if (obj.type.startsWith('fruit_')) {
        this.fruits.push({
          x: worldX, y: worldY, size: 28,
          spriteKey: obj.type, frame: 0,
          frameCount: 17, frameSpeed: 0.07,
          frameTimer: 0, collected: false,
          type: 'fruit'
        });
      } else if (obj.type === 'checkpoint') {
        this.checkpoints.push({
          x: worldX, y: worldY, size: 64,
          state: 'inactive', frame: 0,
          frameCount: 26, frameSpeed: 0.07,
          frameTimer: 0, type: 'checkpoint'
        });
      } else if (obj.type === 'trampoline') {
        this.trampolines.push({
            x: worldX, y: worldY, size: 28,
            state: 'idle', frame: 0,
            frameCount: 8, frameSpeed: 0.05,
            frameTimer: 0, type: 'trampoline'
        });
      } else if (obj.type === 'trophy') {
        this.trophy = {
          x: worldX, y: worldY, size: 32,
          frameCount: 8, animationFrame: 0,
          animationTimer: 0, animationSpeed: 0.35,
          acquired: false, inactive: true, contactMade: false,
        };
      } else if (obj.type === 'spike') {
        this.spikes.push({
            x: worldX, y: worldY, size: 16, type: 'spike'
        });
      } else if (obj.type === 'fire_trap') {
        this.fireTraps.push({
            x: worldX, y: worldY, 
            width: 16, height: 16, // The collision-box size
            solid: true, // Crucial for collision system
            state: 'off', // 'off', 'activating', 'on', 'turning_off'
            playerIsOnTop: false,
            frame: 0, frameTimer: 0,
            turnOffTimer: 0,
            damageTimer: 1.0,
            anim: {
                activating: { frames: 4, speed: 0.1 },
                on: { frames: 3, speed: 0.15 }
            },
            type: 'fire_trap'
        });
      }
    });

    this.totalFruitCount = this.fruits.length;
    this.collectedFruitCount = 0;
    this.completed = false;
  }

  getTileAt(worldX, worldY) {
    const gridX = Math.floor(worldX / GRID_CONSTANTS.TILE_SIZE);
    const gridY = Math.floor(worldY / GRID_CONSTANTS.TILE_SIZE);

    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0) {
      return TILE_DEFINITIONS['1'];
    }
    
    if (gridY >= this.gridHeight) {
      return TILE_DEFINITIONS['0'];
    }

    return this.tiles[gridY][gridX];
  }

  updateCheckpoints(dt) {
    for (const cp of this.checkpoints) {
      if (cp.state === 'activating') {
        cp.frameTimer += dt;
        if (cp.frameTimer >= cp.frameSpeed) {
          cp.frameTimer -= cp.frameSpeed;
          cp.frame++;
          if (cp.frame >= cp.frameCount) {
            cp.frame = 0;
            cp.state = 'active';
          }
        }
      }
    }
  }

  getInactiveCheckpoints() {
    return this.checkpoints.filter(cp => cp.state === 'inactive');
  }

  updateFruits(dt) {
    for (const fruit of this.fruits) {
      if (!fruit.collected) {
        fruit.frameTimer += dt;
        if (fruit.frameTimer >= fruit.frameSpeed) {
          fruit.frameTimer -= fruit.frameSpeed;
          fruit.frame = (fruit.frame + 1) % fruit.frameCount;
        }
      }
    }
  }
  
  updateTrampolines(dt) {
    for (const tramp of this.trampolines) {
        if (tramp.state === 'jumping') {
            tramp.frameTimer += dt;
            if (tramp.frameTimer >= tramp.frameSpeed) {
                tramp.frameTimer -= tramp.frameSpeed;
                tramp.frame++;
                if (tramp.frame >= tramp.frameCount) {
                    tramp.frame = 0;
                    tramp.state = 'idle';
                }
            }
        }
    }
  }

  updateFireTraps(dt) {
    for (const trap of this.fireTraps) {
        if (!trap.playerIsOnTop && trap.state === 'on') {
            trap.state = 'turning_off';
            trap.turnOffTimer = 2.0;
        }

        switch (trap.state) {
            case 'activating':
                trap.frameTimer += dt;
                if (trap.frameTimer >= trap.anim.activating.speed) {
                    trap.frameTimer = 0;
                    trap.frame++;
                    if (trap.frame >= trap.anim.activating.frames) {
                        trap.frame = 0;
                        trap.state = 'on';
                    }
                }
                break;
            case 'on':
                trap.frameTimer += dt;
                if (trap.frameTimer >= trap.anim.on.speed) {
                    trap.frameTimer = 0;
                    trap.frame = (trap.frame + 1) % trap.anim.on.frames;
                }
                break;
            case 'turning_off':
                trap.turnOffTimer -= dt;
                if (trap.turnOffTimer <= 0) {
                    trap.state = 'off';
                    trap.frame = 0;
                }
                break;
        }
    }
  }

  collectFruit(fruit) {
    if (!fruit.collected) {
      fruit.collected = true;
      this.collectedFruitCount++;
      if (this.trophy && this.allFruitsCollected()) {
        this.trophy.inactive = false;
      }
    }
  }

  getActiveFruits() {
    return this.fruits.filter(f => !f.collected);
  }

  getFruitCount() {
    return this.collectedFruitCount;
  }

  getTotalFruitCount() {
    return this.totalFruitCount;
  }

  allFruitsCollected() {
    return this.collectedFruitCount === this.totalFruitCount;
  }

  recalculateCollectedFruits() {
    this.collectedFruitCount = this.fruits.reduce((count, fruit) => {
        return count + (fruit.collected ? 1 : 0);
    }, 0);
  }

  updateTrophyAnimation(dt) {
    const trophy = this.trophy;
    if (!trophy || trophy.inactive || trophy.acquired) return;

    trophy.animationTimer += dt;
    if (trophy.animationTimer >= trophy.animationSpeed) {
      trophy.animationTimer -= trophy.animationSpeed;
      trophy.animationFrame = (trophy.animationFrame + 1) % trophy.frameCount;
    }
  }

  isCompleted() {
    if (this.fruits.length && !this.allFruitsCollected()) return false;
    return !this.trophy || this.trophy.acquired;
  }

  reset() {
    this.fruits.forEach(fruit => {
      fruit.collected = false;
      fruit.frame = 0;
      fruit.frameTimer = 0;
    });
    this.collectedFruitCount = 0;

    this.checkpoints.forEach(cp => {
        cp.state = 'inactive';
        cp.frame = 0;
        cp.frameTimer = 0;
    });
    
    this.trampolines.forEach(tramp => {
        tramp.state = 'idle';
        tramp.frame = 0;
        tramp.frameTimer = 0;
    });

    this.fireTraps.forEach(trap => {
        trap.state = 'off';
        trap.playerIsOnTop = false;
        trap.frame = 0;
        trap.frameTimer = 0;
        trap.turnOffTimer = 0;
        trap.damageTimer = 1.0;
    });

    this.spikes.forEach(spike => {});

    if (this.trophy) {
      this.trophy.acquired = false;
      this.trophy.inactive = true;
      this.trophy.animationFrame = 0;
      this.trophy.animationTimer = 0;
    }
    this.completed = false;
  }
}