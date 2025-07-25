import { TILE_DEFINITIONS } from './tile-definitions.js';
import { GRID_CONSTANTS } from '../utils/constants.js';
import * as Traps from '../traps/index.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { SpatialGrid } from '../utils/spatial-grid.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { createEnemy } from './enemy-factory.js';
import { eventBus } from '../utils/event-bus.js';


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
};

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

    (levelConfig.objects || []).forEach(obj => {
      const worldX = obj.x * GRID_CONSTANTS.TILE_SIZE;
      const worldY = obj.y * GRID_CONSTANTS.TILE_SIZE;

      const TrapClass = trapFactory[obj.type];

      if (TrapClass) {
        const instance = new TrapClass(worldX, worldY, obj);
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