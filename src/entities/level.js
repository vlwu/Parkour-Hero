import { TILE_DEFINITIONS } from './tile-definitions.js';
import { GRID_CONSTANTS } from '../utils/constants.js';
import { createSpike, createTrampoline, createFireTrap } from './entity-factory.js';

export class Level {
  constructor(levelConfig, entityManager) {
    this.name = levelConfig.name || 'Unnamed Level';

    this.gridWidth = levelConfig.gridWidth;
    this.gridHeight = levelConfig.gridHeight;
    this.width = this.gridWidth * GRID_CONSTANTS.TILE_SIZE;
    this.height = this.gridHeight * GRID_CONSTANTS.TILE_SIZE;
    this.background = levelConfig.background || 'background_blue';
    this.backgroundScroll = levelConfig.backgroundScroll || { x: 0, y: 15 };

    this.startPosition = {
      x: levelConfig.startPosition.x * GRID_CONSTANTS.TILE_SIZE,
      y: levelConfig.startPosition.y * GRID_CONSTANTS.TILE_SIZE,
    };

    this.tiles = levelConfig.layout.map(rowString =>
      [...rowString].map(tileId => TILE_DEFINITIONS[tileId] || TILE_DEFINITIONS['0'])
    );

    this.fruits = (levelConfig.objects || []).filter(obj => obj.type.startsWith('fruit_')).map(obj => ({
        x: obj.x * GRID_CONSTANTS.TILE_SIZE, y: obj.y * GRID_CONSTANTS.TILE_SIZE, size: 28,
        spriteKey: obj.type, frame: 0, frameCount: 17, frameSpeed: 0.07,
        frameTimer: 0, collected: false, type: 'fruit'
    }));

    this.checkpoints = (levelConfig.objects || []).filter(obj => obj.type === 'checkpoint').map(obj => ({
        x: obj.x * GRID_CONSTANTS.TILE_SIZE, y: obj.y * GRID_CONSTANTS.TILE_SIZE, size: 64,
        state: 'inactive', frame: 0, frameCount: 26, frameSpeed: 0.07,
        frameTimer: 0, type: 'checkpoint'
    }));

    const trophyObj = (levelConfig.objects || []).find(obj => obj.type === 'trophy');
    if (trophyObj) {
        this.trophy = {
            x: trophyObj.x * GRID_CONSTANTS.TILE_SIZE, y: trophyObj.y * GRID_CONSTANTS.TILE_SIZE, size: 32,
            frameCount: 8, animationFrame: 0, animationTimer: 0, animationSpeed: 0.35,
            acquired: false, inactive: true, contactMade: false, type: 'trophy'
        };
    } else {
        this.trophy = null;
    }

    (levelConfig.objects || []).forEach(obj => {
      const worldX = obj.x * GRID_CONSTANTS.TILE_SIZE + GRID_CONSTANTS.TILE_SIZE / 2;
      let worldY;

      switch (obj.type) {
        case 'trampoline':
          // MODIFICATION: Adjusted Y offset for better visual alignment.
          worldY = obj.y * GRID_CONSTANTS.TILE_SIZE; 
          createTrampoline(entityManager, worldX, worldY);
          break;
        case 'spike':
          worldY = obj.y * GRID_CONSTANTS.TILE_SIZE - 8;
          createSpike(entityManager, worldX, worldY);
          break;
        case 'fire_trap':
          worldY = obj.y * GRID_CONSTANTS.TILE_SIZE - 8;
          createFireTrap(entityManager, worldX, worldY);
          break;
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
      this.animationTimer = 0;
    }
    this.completed = false;
  }
}