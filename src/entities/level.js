import { TILE_DEFINITIONS } from './tile-definitions.js';
import { GRID_CONSTANTS } from '../utils/constants.js';
import * as Traps from '../traps/index.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';

// Factory to map level data types to their corresponding trap classes.
const trapFactory = {
  fire_trap: Traps.FireTrap,
  spike: Traps.Spikes,
  trampoline: Traps.Trampoline,
};

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
    this.traps = []; // MODIFIED: A single array for all traps.
    this.trophy = null;

    (levelConfig.objects || []).forEach(obj => {
      const worldX = obj.x * GRID_CONSTANTS.TILE_SIZE;
      const worldY = obj.y * GRID_CONSTANTS.TILE_SIZE;
      
      const TrapClass = trapFactory[obj.type];

      if (TrapClass) {
        // MODIFIED: Use the factory to create a new trap instance
        this.traps.push(new TrapClass(worldX, worldY, obj));
      } else if (obj.type.startsWith('fruit_')) {
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
      } else if (obj.type === 'trophy') {
        this.trophy = {
          x: worldX, y: worldY, size: 32,
          frameCount: 8, animationFrame: 0,
          animationTimer: 0, animationSpeed: 0.35,
          acquired: false, inactive: true, contactMade: false,
        };
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
  
  /**
   * NEW: Main update loop for all dynamic level objects.
   * The Engine will call this method every frame.
   * @param {number} dt Delta time.
   * @param {EntityManager} entityManager The entity manager.
   * @param {number} playerEntityId The ID of the player entity.
   * @param {object} eventBus The global event bus.
   */
  update(dt, entityManager, playerEntityId, eventBus) {
      this.updateFruits(dt);
      this.updateTrophyAnimation(dt);
      this.updateCheckpoints(dt);
      
      const playerPos = entityManager.getComponent(playerEntityId, PositionComponent);
      const playerCol = entityManager.getComponent(playerEntityId, CollisionComponent);
      
      // Pass player data to traps so they can react to proximity.
      const playerData = playerPos && playerCol ? { ...playerPos, width: playerCol.width, height: playerCol.height } : null;

      // MODIFIED: Delegate updates to the trap modules.
      for (const trap of this.traps) {
          trap.update(dt, playerData, eventBus);
      }
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

  // REMOVED: updateTrampolines, updateFireTraps, and updateSpikes methods.
  // Their logic is now inside their respective trap modules.

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
    
    // MODIFIED: Delegate resets to the trap modules.
    this.traps.forEach(trap => {
        trap.reset();
    });

    if (this.trophy) {
      this.trophy.acquired = false;
      this.trophy.inactive = true;
      this.trophy.animationFrame = 0;
      this.trophy.animationTimer = 0;
    }
    this.completed = false;
  }
}