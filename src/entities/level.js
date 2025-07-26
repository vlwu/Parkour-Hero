import { TILE_DEFINITIONS } from './tile-definitions.js';
import { GRID_CONSTANTS } from '../utils/constants.js';
import * as Traps from '../traps/index.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { SpatialGrid } from '../utils/spatial-grid.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { createEnemy } from './enemy-factory.js';
import { eventBus } from '../utils/event-bus.js';

// Definitions for our new static platform objects
const staticPlatformDefinitions = {
    'wood_third_h': { spriteConfig: { srcX: 192, srcY: 0, width: 48, height: 16 }, collisionBox: { width: 48, height: 16 }, oneway: false, surfaceType: 'wood' },
    'wood_third_v': { spriteConfig: { srcX: 240, srcY: 0, width: 16, height: 48 }, collisionBox: { width: 16, height: 48 }, oneway: false, surfaceType: 'wood' },
    'wood_ninth_sq': { spriteConfig: { srcX: 192, srcY: 16, width: 16, height: 16 }, collisionBox: { width: 16, height: 16 }, oneway: false, surfaceType: 'wood' },
    'wood_four_ninths_sq': { spriteConfig: { srcX: 208, srcY: 16, width: 32, height: 32 }, collisionBox: { width: 32, height: 32 }, oneway: false, surfaceType: 'wood' },
    'stone_third_h': { spriteConfig: { srcX: 192, srcY: 64, width: 48, height: 16 }, collisionBox: { width: 48, height: 16 }, oneway: false, surfaceType: 'stone' },
    'stone_third_v': { spriteConfig: { srcX: 240, srcY: 64, width: 16, height: 48 }, collisionBox: { width: 16, height: 48 }, oneway: false, surfaceType: 'stone' },
    'stone_ninth_sq': { spriteConfig: { srcX: 192, srcY: 80, width: 16, height: 16 }, collisionBox: { width: 16, height: 16 }, oneway: false, surfaceType: 'stone' },
    'stone_four_ninths_sq': { spriteConfig: { srcX: 208, srcY: 80, width: 32, height: 32 }, collisionBox: { width: 32, height: 32 }, oneway: false, surfaceType: 'stone' },
    'gold_third_h': { spriteConfig: { srcX: 272, srcY: 128, width: 48, height: 16 }, collisionBox: { width: 48, height: 16 }, oneway: true, surfaceType: 'oneway_gold' },
    'gold_third_v': { spriteConfig: { srcX: 320, srcY: 128, width: 16, height: 48 }, collisionBox: { width: 16, height: 48 }, oneway: true, surfaceType: 'oneway_gold' },
    'gold_ninth_sq': { spriteConfig: { srcX: 272, srcY: 144, width: 16, height: 16 }, collisionBox: { width: 16, height: 16 }, oneway: true, surfaceType: 'oneway_gold' },
    'gold_four_ninths_sq': { spriteConfig: { srcX: 288, srcY: 144, width: 32, height: 32 }, collisionBox: { width: 32, height: 32 }, oneway: true, surfaceType: 'oneway_gold' },
    'orange_dirt_third_h': { spriteConfig: { srcX: 192, srcY: 128, width: 48, height: 16 }, collisionBox: { width: 48, height: 16 }, oneway: false, surfaceType: 'orange_dirt' },
    'orange_dirt_third_v': { spriteConfig: { srcX: 240, srcY: 128, width: 16, height: 48 }, collisionBox: { width: 16, height: 48 }, oneway: false, surfaceType: 'orange_dirt' },
    'orange_dirt_ninth_sq': { spriteConfig: { srcX: 192, srcY: 144, width: 16, height: 16 }, collisionBox: { width: 16, height: 16 }, oneway: false, surfaceType: 'orange_dirt' },
    'orange_dirt_four_ninths_sq': { spriteConfig: { srcX: 208, srcY: 144, width: 32, height: 32 }, collisionBox: { width: 32, height: 32 }, oneway: false, surfaceType: 'orange_dirt' },
};

class StaticPlatform {
    constructor(x, y, config) {
        const def = staticPlatformDefinitions[config.type];
        this.x = x;
        this.y = y;
        this.width = def.collisionBox.width;
        this.height = def.collisionBox.height;
        this.type = config.type;
        this.spriteConfig = def.spriteConfig;
        this.surfaceType = def.surfaceType;
        this.solid = true;
        this.oneway = def.oneway;
    }
    get hitbox() { return { x: this.x - this.width / 2, y: this.y - this.height / 2, width: this.width, height: this.height }; }
    update() {}
    render(ctx, assets, camera) {
        const sprite = assets['block'];
        if (!sprite) return;
        const drawX = this.x - this.width / 2;
        const drawY = this.y - this.height / 2;
        if (!camera.isVisible(drawX, drawY, this.width, this.height)) return;
        ctx.drawImage(sprite, this.spriteConfig.srcX, this.spriteConfig.srcY, this.spriteConfig.width, this.spriteConfig.height, drawX, drawY, this.width, this.height);
    }
    reset() {}
    onCollision() {}
}

const trapFactory = {
  fire_trap: Traps.FireTrap,
  spike: Traps.Spikes,
  trampoline: Traps.Trampoline,
  spiked_ball: Traps.SpikedBall,
  arrow_bubble: Traps.ArrowBubble,
  fan: Traps.Fan,
  falling_platform: Traps.FallingPlatform,
  rock_head: Traps.RockHead,
  spike_head: Traps.SpikeHead,
  saw: Traps.Saw,
  slime_puddle: Traps.SlimePuddle,
};

Object.keys(staticPlatformDefinitions).forEach(type => {
    trapFactory[type] = StaticPlatform;
});
// --- END NEW ---

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
    
    this.spatialGrid = new SpatialGrid(this.width, this.height, GRID_CONSTANTS.TILE_SIZE * 4);


    this.fruits = [];
    this.checkpoints = [];
    this.traps = [];
    this.trophy = null;
    this.initialEnemyConfigs = levelConfig.enemies || []; // Store for respawning
    eventBus.subscribe('createSlimePuddle', (pos) => this.addSlimePuddle(pos));

    (levelConfig.objects || []).forEach(obj => {
      const worldX = obj.x * GRID_CONSTANTS.TILE_SIZE;
      const worldY = obj.y * GRID_CONSTANTS.TILE_SIZE;

      const ItemClass = trapFactory[obj.type];

      if (ItemClass) {
        const instance = new ItemClass(worldX, worldY, obj);
        this.traps.push(instance);
      } else if (obj.type.startsWith('fruit_')) {
        const instance = {
          x: worldX, y: worldY, size: 28,
          spriteKey: obj.type, frame: 0,
          frameCount: 17, frameSpeed: 0.07,
          frameTimer: 0, collected: false,
          type: 'fruit'
        };
        this.fruits.push(instance);
      } else if (obj.type === 'checkpoint') {
        const instance = {
          x: worldX, y: worldY, size: 64,
          state: 'inactive', frame: 0,
          frameCount: 26, frameSpeed: 0.07,
          frameTimer: 0, type: 'checkpoint'
        };
        this.checkpoints.push(instance);
      } else if (obj.type === 'trophy') {
        this.trophy = {
          x: worldX, y: worldY, size: 64,
          frameCount: 8, animationFrame: 0,
          animationTimer: 0, animationSpeed: 0.07,
          acquired: false, inactive: true, contactMade: false,
          isAnimating: false, type: 'trophy'
        };
      }
    });

    if (entityManager) {
        this.resetEnemies(entityManager);
    }
    this._populateSpatialGrid();

    this.totalFruitCount = this.fruits.length;
    this.collectedFruitCount = 0;
    this.completed = false;
  }

  addSlimePuddle(position) {
    const puddleTrap = new Traps.SlimePuddle(position.x, position.y, {});
    this.traps.push(puddleTrap);
    
    const gridObject = { ...(puddleTrap.hitbox), instance: puddleTrap, type: 'trap' };
    puddleTrap.gridObject = gridObject;
    this.spatialGrid.insert(gridObject);
  }

  _populateSpatialGrid() {
      this.spatialGrid.clear();
      this.traps.forEach(instance => {
        const gridObject = { ...(instance.hitbox || { x: instance.x, y: instance.y, width: 1, height: 1 }), instance, type: 'trap' };
        instance.gridObject = gridObject;
        this.spatialGrid.insert(gridObject)
      });
      this.fruits.forEach(instance => this.spatialGrid.insert({ x: instance.x - 14, y: instance.y - 14, width: 28, height: 28, instance, type: 'fruit' }));
      this.checkpoints.forEach(instance => this.spatialGrid.insert({ x: instance.x - 32, y: instance.y - 32, width: 64, height: 64, instance, type: 'checkpoint' }));
      if (this.trophy) {
          this.spatialGrid.insert({ x: this.trophy.x - 32, y: this.trophy.y - 32, width: 64, height: 64, instance: this.trophy, type: 'trophy' });
      }
  }

  getTileAt(worldX, worldY) {
    const gridX = Math.floor(worldX / GRID_CONSTANTS.TILE_SIZE);
    const gridY = Math.floor(worldY / GRID_CONSTANTS.TILE_SIZE);


    if (gridX < 0 || gridX >= this.gridWidth) {
      return TILE_DEFINITIONS['0'];
    }
    if (gridY < 0) {
      return TILE_DEFINITIONS['1'];
    }


    if (gridY >= this.gridHeight || !this.tiles[gridY]) {
      return TILE_DEFINITIONS['0'];
    }


    return this.tiles[gridY][gridX] || TILE_DEFINITIONS['0'];
  }

  // Precise collision check method for any point in the world
  isSolidAt(worldX, worldY, ignoreOneWay = false) {
    const tile = this.getTileAt(worldX, worldY);
    if (!tile || !tile.solid) return false;
    if (ignoreOneWay && tile.oneWay) return false;
    
    // If it's a fractional block, we need to check if the point is within its collision box
    if (tile.collisionBox) {
        const tileStartX = Math.floor(worldX / GRID_CONSTANTS.TILE_SIZE) * GRID_CONSTANTS.TILE_SIZE;
        const tileStartY = Math.floor(worldY / GRID_CONSTANTS.TILE_SIZE) * GRID_CONSTANTS.TILE_SIZE;
        
        const pointInTileX = worldX - tileStartX;
        const pointInTileY = worldY - tileStartY;
        
        return pointInTileX >= 0 && pointInTileX < tile.collisionBox.width && 
               pointInTileY >= 0 && pointInTileY < tile.collisionBox.height;
    }
    
    return true; // It's a full solid block
  }

  update(dt, entityManager, playerEntityId, eventBus, camera) {
      const playerPos = entityManager.getComponent(playerEntityId, PositionComponent);
      const playerCol = entityManager.getComponent(playerEntityId, CollisionComponent);
      const playerData = playerPos && playerCol ? { ...playerPos, width: playerCol.width, height: playerCol.height } : null;

      for (const trap of this.traps) {
          trap.update(dt, playerData, eventBus, this);
      }

      const expiredTraps = [];
      this.traps = this.traps.filter(trap => {
          if (trap.isExpired && trap.gridObject) {
              expiredTraps.push(trap.gridObject);
              return false;
          }
          return true;
      });
      if (expiredTraps.length > 0) {
          this.spatialGrid.removeObjects(expiredTraps);
      }

      const visibleObjects = this.spatialGrid.query(camera.getViewportBounds());
      for (const obj of visibleObjects) {
          if (obj.instance) {
              const instance = obj.instance;
              switch(obj.type) { 
                  case 'fruit':
                      this._updateSingleFruit(instance, dt);
                      break;
                  case 'checkpoint':
                      this._updateSingleCheckpoint(instance, dt);
                      break;
                  case 'trophy':
                      this._updateSingleTrophy(instance, dt);
                      break;
              }
          }
      }
  }

  _updateSingleCheckpoint(cp, dt) {
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

  _updateSingleFruit(fruit, dt) {
    if (!fruit.collected) {
      fruit.frameTimer += dt;
      if (fruit.frameTimer >= fruit.frameSpeed) {
        fruit.frameTimer -= fruit.frameSpeed;
        fruit.frame = (fruit.frame + 1) % fruit.frameCount;
      }
    }
  }

  _updateSingleTrophy(trophy, dt) {
    if (!trophy || !trophy.isAnimating || trophy.acquired) return;

    trophy.animationTimer += dt;
    if (trophy.animationTimer >= trophy.animationSpeed) {
      trophy.animationTimer -= trophy.animationSpeed;
      trophy.animationFrame = (trophy.animationFrame + 1);


      if (trophy.animationFrame >= trophy.frameCount) {
        trophy.animationFrame = trophy.frameCount - 1;
        trophy.isAnimating = false;
        trophy.acquired = true;
      }
    }
  }

  getInactiveCheckpoints() {
    return this.checkpoints.filter(cp => cp.state === 'inactive');
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

  isCompleted() {
    if (this.fruits.length && !this.allFruitsCollected()) return false;
    return !this.trophy || this.trophy.acquired;
  }

  resetEnemies(entityManager) {
    const currentEnemies = entityManager.query([EnemyComponent]);
    for (const id of currentEnemies) {
        entityManager.destroyEntity(id);
    }

    this.initialEnemyConfigs.forEach(enemyConfig => {
        const worldX = enemyConfig.x * GRID_CONSTANTS.TILE_SIZE;
        const worldY = enemyConfig.y * GRID_CONSTANTS.TILE_SIZE;
        createEnemy(entityManager, enemyConfig.type, worldX, worldY, enemyConfig);
    });
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

    this.traps.forEach(trap => {
        trap.reset(eventBus);
    });

    if (this.trophy) {
      this.trophy.acquired = false;
      this.trophy.inactive = true;
      this.trophy.isAnimating = false;
      this.trophy.animationFrame = 0;
      this.trophy.animationTimer = 0;
    }
    
    this._populateSpatialGrid(); 
    this.completed = false;
  }
}