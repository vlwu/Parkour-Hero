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
    this.background = levelConfig.background || 'backgroundTile';

    // Convert player start position from grid units to world coordinates
    this.startPosition = {
      x: levelConfig.startPosition.x * GRID_CONSTANTS.TILE_SIZE,
      y: levelConfig.startPosition.y * GRID_CONSTANTS.TILE_SIZE,
    };

    // --- Core Grid Parsing ---
    // The old 'platforms' array and SpatialHashGrid are no longer needed.
    // We parse the 'layout' array into a 2D array of rich tile objects.
    this.tiles = levelConfig.layout.map(rowString =>
      // Use the spread operator to easily iterate over the characters of the string
      [...rowString].map(tileId => TILE_DEFINITIONS[tileId] || TILE_DEFINITIONS['0'])
    );

    // Dynamic objects are still managed as separate entities, but their
    // initial positions are now defined in grid units for easy placement.
    this.fruits = [];
    this.checkpoints = [];
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
          type: 'fruit' // Keep a generic type for collision systems
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

  /**
   * Returns the tile definition object for a given world coordinate.
   * This is the new cornerstone for all static collision detection.
   * @param {number} worldX The x-position in pixels.
   * @param {number} worldY The y-position in pixels.
   * @returns {object} The tile definition from TILE_DEFINITIONS.
   */
  getTileAt(worldX, worldY) {
    const gridX = Math.floor(worldX / GRID_CONSTANTS.TILE_SIZE);
    const gridY = Math.floor(worldY / GRID_CONSTANTS.TILE_SIZE);

    // Create solid walls on the sides and top of the level.
    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0) {
      return TILE_DEFINITIONS['1']; // Return a basic 'dirt' wall.
    }
    
    // Allow falling through the bottom of the level.
    if (gridY >= this.gridHeight) {
      return TILE_DEFINITIONS['0']; // Return an empty tile.
    }

    // Otherwise, return the actual tile from the grid.
    return this.tiles[gridY][gridX];
  }


  // --- Methods for Dynamic Objects (largely unchanged) ---

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

    if (this.trophy) {
      this.trophy.acquired = false;
      this.trophy.inactive = true;
      this.trophy.animationFrame = 0;
      this.trophy.animationTimer = 0;
    }
    this.completed = false;
  }
}