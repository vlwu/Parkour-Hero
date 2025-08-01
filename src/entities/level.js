import { getTileProperties } from './tile-definitions.js';
import { GRID_CONSTANTS } from '../utils/constants.js';
import * as Traps from '../traps/index.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { SpatialGrid } from '../utils/spatial-grid.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { createEnemy } from './enemy-factory.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from './enemy-definitions.js';


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

export class Level {
  constructor(levelConfig, entityManager) {
    this.name = levelConfig.name || 'Unnamed Level';


    this.gridWidth = levelConfig.gridWidth;
    this.gridHeight = levelConfig.gridHeight;
    this.width = this.gridWidth * GRID_CONSTANTS.TILE_SIZE;
    this.height = this.gridHeight * GRID_CONSTANTS.TILE_SIZE;
    this.background = levelConfig.background || 'background_blue';
    this.backgroundScroll = levelConfig.backgroundScroll || { x: 0, y: 15 };

    let startX, startY;
    if (Array.isArray(levelConfig.startPosition)) {
        startX = levelConfig.startPosition[0];
        startY = levelConfig.startPosition[1];
    } else if (typeof levelConfig.startPosition === 'object' && levelConfig.startPosition !== null) {
        startX = levelConfig.startPosition.x;
        startY = levelConfig.startPosition.y;
    }

    this.startPosition = {
      x: startX * GRID_CONSTANTS.TILE_SIZE,
      y: startY * GRID_CONSTANTS.TILE_SIZE,
    };

    this.tiles = Array(this.gridHeight).fill(null).map(() =>
        Array(this.gridWidth).fill(0)
    );

    if (typeof levelConfig.tileData === 'string') {
        this._parseRLETileData(levelConfig.tileData);
    } else {
        console.warn(`Level "${this.name}" was loaded with an invalid or outdated tileData format. Tiles will not be loaded.`);
    }

    this.spatialGrid = new SpatialGrid(this.width, this.height, GRID_CONSTANTS.TILE_SIZE * 4);


    this.fruits = [];
    this.checkpoints = [];
    this.traps = [];
    this.trophy = null;
    this.initialEnemyConfigs = [];
    this.slimePuddlePool = [];
    eventBus.subscribe('createSlimePuddle', (pos) => this.addSlimePuddle(pos));

    const allEntities = [
        ...(levelConfig.entities || [])
    ];
    const fractionalPlatformTypes = {
        'wood_third_h': { w: 3, h: 1, ids: [13, 14, 15] },
        'wood_third_v': { w: 1, h: 3, ids: [16, 38, 60] },
        'wood_ninth_sq': { w: 1, h: 1, ids: [35] },
        'wood_four_ninths_sq': { w: 2, h: 2, ids: [36, 37, 58, 59] },
        'stone_third_h': { w: 3, h: 1, ids: [101, 102, 103] },
        'stone_third_v': { w: 1, h: 3, ids: [104, 126, 148] },
        'stone_ninth_sq': { w: 1, h: 1, ids: [123] },
        'stone_four_ninths_sq': { w: 2, h: 2, ids: [124, 125, 146, 147] },
        'gold_third_h': { w: 3, h: 1, ids: [194, 195, 196] },
        'gold_third_v': { w: 1, h: 3, ids: [197, 219, 241] },
        'gold_ninth_sq': { w: 1, h: 1, ids: [216] },
        'gold_four_ninths_sq': { w: 2, h: 2, ids: [217, 218, 239, 240] },
        'orange_dirt_third_h': { w: 3, h: 1, ids: [189, 190, 191] },
        'orange_dirt_third_v': { w: 1, h: 3, ids: [192, 214, 236] },
        'orange_dirt_ninth_sq': { w: 1, h: 1, ids: [211] },
        'orange_dirt_four_ninths_sq': { w: 2, h: 2, ids: [212, 213, 234, 235] }
    };

    allEntities.forEach(entityData => {
        const type = entityData[0];
        const worldX = entityData[1] * GRID_CONSTANTS.TILE_SIZE;
        const worldY = entityData[2] * GRID_CONSTANTS.TILE_SIZE;

        if (fractionalPlatformTypes[type]) {
            const platform = fractionalPlatformTypes[type];
            const platformPixelWidth = platform.w * GRID_CONSTANTS.TILE_SIZE;
            const platformPixelHeight = platform.h * GRID_CONSTANTS.TILE_SIZE;

            const startGridX = Math.round((worldX - platformPixelWidth / 2) / GRID_CONSTANTS.TILE_SIZE);
            const startGridY = Math.round((worldY - platformPixelHeight / 2) / GRID_CONSTANTS.TILE_SIZE);

            for (let y = 0; y < platform.h; y++) {
                for (let x = 0; x < platform.w; x++) {
                    const tileX = startGridX + x;
                    const tileY = startGridY + y;
                    if (tileX >= 0 && tileX < this.gridWidth && tileY >= 0 && tileY < this.gridHeight) {
                        const tileIndexInPlatform = y * platform.w + x;
                        this.tiles[tileY][tileX] = platform.ids[tileIndexInPlatform];
                    }
                }
            }
            return;
        }

        const config = { type };

        if (ENEMY_DEFINITIONS[type]) {
            let propIndex = 3;
            if (type === 'bluebird') {
                config.patrolDistance = entityData[propIndex++];
                config.horizontalSpeed = entityData[propIndex++];
                config.verticalAmplitude = entityData[propIndex++];
            } else if (type === 'radish' || type === 'bee') {
                config.patrolBoxSize = entityData[propIndex++];
            }
            this.initialEnemyConfigs.push({ ...config, x: entityData[1], y: entityData[2] });
            return;
        }

        let propIndex = 3;
        switch (type) {
            case 'fire_trap':
                config.chainLength = entityData[propIndex++];
                break;
            case 'spiked_ball':
                config.chainLength = entityData[propIndex++];
                config.swingArc = entityData[propIndex++];
                config.period = entityData[propIndex++];
                config.tiltAmount = entityData[propIndex++];
                break;
            case 'arrow_bubble':
                config.direction = entityData[propIndex++];
                config.knockbackSpeed = entityData[propIndex++];
                break;
            case 'fan':
                config.direction = entityData[propIndex++];
                config.pushStrength = entityData[propIndex++];
                config.windHeight = entityData[propIndex++];
                break;
            case 'saw':
                config.direction = entityData[propIndex++];
                config.distance = entityData[propIndex++];
                config.speed = entityData[propIndex++];
                break;
        }

        if (type === 'fire_trap') {
            const chainLength = config.chainLength || 1;
            const segmentWidth = 16;
            for (let i = 0; i < chainLength; i++) {
                const segmentX = worldX + (i * segmentWidth);
                const segmentConfig = { ...config, chainLength: 1 };
                const instance = new Traps.FireTrap(segmentX, worldY, segmentConfig);
                this.traps.push(instance);
            }
        } else {
            const ItemClass = trapFactory[type];
            if (ItemClass) {
                const instance = new ItemClass(worldX, worldY, config);
                this.traps.push(instance);
            } else if (type.startsWith('fruit_')) {
                const instance = {
                    x: worldX, y: worldY, size: 28,
                    spriteKey: type, frame: 0,
                    frameCount: 17, frameSpeed: 0.07,
                    frameTimer: 0, collected: false,
                    type: 'fruit'
                };
                this.fruits.push(instance);
            } else if (type === 'checkpoint') {
                const instance = {
                    x: worldX, y: worldY, size: 64,
                    state: 'inactive', frame: 0,
                    frameCount: 26, frameSpeed: 0.07,
                    frameTimer: 0, type: 'checkpoint'
                };
                this.checkpoints.push(instance);
            } else if (type === 'trophy') {
                this.trophy = {
                    x: worldX, y: worldY, size: 64,
                    frameCount: 8, animationFrame: 0,
                    animationTimer: 0, animationSpeed: 0.07,
                    acquired: false, inactive: true, contactMade: false,
                    isAnimating: false, type: 'trophy'
                };
            }
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

  _parseRLETileData(rleString) {
    if (!rleString) return;

    const parts = rleString.split(',');
    let i = 0;
    for (const part of parts) {
        const [countStr, tileIdStr] = part.split(':');
        const count = parseInt(countStr, 10);
        const tileId = parseInt(tileIdStr, 10);
        for (let j = 0; j < count; j++) {
            if (i >= this.gridWidth * this.gridHeight) break;
            const x = i % this.gridWidth;
            const y = Math.floor(i / this.gridWidth);
            this.tiles[y][x] = tileId;
            i++;
        }
    }
  }

  addSlimePuddle(position) {
    let puddleTrap;
    if (this.slimePuddlePool.length > 0) {
        puddleTrap = this.slimePuddlePool.pop();
        puddleTrap.reset(position.x, position.y);
    } else {
        puddleTrap = new Traps.SlimePuddle(position.x, position.y, {});
    }
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

    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
      return 0;
    }
    return this.tiles[gridY]?.[gridX] || 0;
  }

  getTilePropertiesAt(worldX, worldY) {
    const tileId = this.getTileAt(worldX, worldY);
    return getTileProperties(tileId);
  }

  isSolidAt(worldX, worldY, ignoreOneWay = false) {
    const tileProperties = this.getTilePropertiesAt(worldX, worldY);
    if (tileProperties && tileProperties.solid) {
      if (!(ignoreOneWay && tileProperties.oneWay)) {
        return true;
      }
    }

    const potentialColliders = this.spatialGrid.query({ x: worldX, y: worldY, width: 1, height: 1 });
    for (const obj of potentialColliders) {
      if (obj.instance && obj.instance.solid && obj.type === 'trap') {
        if (ignoreOneWay && obj.instance.oneway) {
          continue;
        }

        const hitbox = obj.instance.hitbox;
        if (
          worldX >= hitbox.x && worldX < hitbox.x + hitbox.width &&
          worldY >= hitbox.y && worldY < hitbox.y + hitbox.height
        ) {
          return true;
        }
      }
    }

    return false;
  }

  update(dt, entityManager, playerEntityId, eventBus, camera) {
      const playerPos = entityManager.getComponent(playerEntityId, PositionComponent);
      const playerCol = entityManager.getComponent(playerEntityId, CollisionComponent);
      const playerData = playerPos && playerCol ? { ...playerPos, width: playerCol.width, height: playerCol.height } : null;

      for (const trap of this.traps) {
          trap.update(dt, playerData, eventBus, this);
      }

      const remainingTraps = [];
      for (const trap of this.traps) {
          if (trap.isExpired) {
              if (trap.gridObject) {
                  this.spatialGrid.removeObjectFromCells(trap.id, this.spatialGrid.getGridIndices(trap.gridObject));
              }
              if (trap.type === 'slime_puddle') {
                  this.slimePuddlePool.push(trap);
              }
          } else {
              remainingTraps.push(trap);
          }
      }
      this.traps = remainingTraps;

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

  resetEnemies(entityManager, collisionSystem) {
    const currentEnemies = entityManager.query([EnemyComponent]);
    for (const id of currentEnemies) {
      if (collisionSystem) {
        collisionSystem.removeDynamicEntity(id, entityManager);
      }
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
        if (trap.type === 'slime_puddle') {
            if (trap.gridObject) {
                this.spatialGrid.removeObjectFromCells(trap.id, this.spatialGrid.getGridIndices(trap.gridObject));
            }
            this.slimePuddlePool.push(trap);
        } else {
            trap.reset(eventBus);
        }
    });
    this.traps = this.traps.filter(trap => trap.type !== 'slime_puddle');

    if (this.trophy) {
      this.trophy.acquired = false;
      this.trophy.inactive = true;
      this.isAnimating = false;
      this.trophy.animationFrame = 0;
      this.trophy.animationTimer = 0;
    }

    this._populateSpatialGrid();
    this.completed = false;
  }
}