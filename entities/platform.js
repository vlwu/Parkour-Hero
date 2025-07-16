// Spatial hash grid for efficient broad-phase collision detection.
class SpatialHashGrid {
  constructor(levelWidth, levelHeight, cellSize) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.widthInCells = Math.ceil(levelWidth / cellSize);
    this.heightInCells = Math.ceil(levelHeight / cellSize);
  }

  _getGridIndices(obj) {
    const x1 = Math.floor(obj.x / this.cellSize);
    const y1 = Math.floor(obj.y / this.cellSize);
    const objWidth = obj.width || obj.size || 0;
    const objHeight = obj.height || obj.size || 0;
    const x2 = Math.floor((obj.x + objWidth) / this.cellSize);
    const y2 = Math.floor((obj.y + objHeight) / this.cellSize);
    return { x1, y1, x2, y2 };
  }

  insert(obj) {
    const { x1, y1, x2, y2 } = this._getGridIndices(obj);
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const key = `${x},${y}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, new Set());
        }
        this.grid.get(key).add(obj);
      }
    }
  }

  query(x, y, width = 0, height = 0) {
    const potentialColliders = new Set();
    const queryObj = { x, y, width, height };
    const { x1, y1, x2, y2 } = this._getGridIndices(queryObj);

    for (let j = y1; j <= y2; j++) {
      for (let i = x1; i <= x2; i++) {
        const key = `${i},${j}`;
        if (this.grid.has(key)) {
          for (const obj of this.grid.get(key)) {
            potentialColliders.add(obj);
          }
        }
      }
    }
    return Array.from(potentialColliders);
  }

  clear() {
    this.grid.clear();
  }
}


export class Platform {
  constructor(x, y, width, height, terrainType = 'dirt') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.terrainType = terrainType; 
    this.type = 'platform'; // Added for spatial grid filtering

    // Sprite sheet configuration for terrain tiles
    this.spriteConfig = {
      dirt: { srcX: 96, srcY: 0 },     
      stone: { srcX: 0, srcY: 0 },    
      wood: { srcX: 0, srcY: 64 },     
      green_block: { srcX: 0, srcY: 128 }, 
      orange_dirt: { srcX: 96, srcY: 64 }, 
      pink_dirt: { srcX: 96, srcY: 128 }, 
      red_brick: { srcX: 272, srcY: 64 }, 
    };

    this.tileSize = 48; // Size of each tile in the spritesheet
  }

  // Fast AABB collision check (point or rectangle)
  collidesWith(x, y, width = 0, height = 0) {
    // Early exit for non-overlapping cases
    if (x + width <= this.x || x >= this.x + this.width) return false;
    if (y + height <= this.y || y >= this.y + this.height) return false;
    return true;
  }

  // Fast check: is player standing on top of this platform?
  isPlayerOnTop(player) {
    const pb = player.y + player.height; 
    const pt = this.y; 

    if (player.x + player.width <= this.x || player.x >= this.x + this.width) return false; // Early exit if not horizontally aligned

    // Check vertical overlap with small tolerance (<= 10px)
    return pb >= pt && pb <= pt + 10;
  }

  render(ctx, assets) {
    try {
      const terrainSprite = assets.block;

      if (!terrainSprite) {
        this.renderFallback(ctx);
        return;
      }

      const config = this.spriteConfig[this.terrainType];
      const fullTiles = Math.floor(this.width / this.tileSize);

      for (let i = 0; i < fullTiles; i++) {
        const tileX = this.x + i * this.tileSize;
        ctx.drawImage(
          terrainSprite,
          config.srcX, config.srcY,
          this.tileSize, this.tileSize,
          tileX, this.y,
          this.tileSize, this.tileSize
        );
      }

    } catch (error) {
      console.warn('Error rendering platform:', error);
      this.renderFallback(ctx);
    }
  }

  renderFallback(ctx) {
    // Simple colored rectangle fallback
    const colors = {
      dirt: '#8B4513',    
      stone: '#696969',   
      wood: '#D2691E'    
    };

    ctx.fillStyle = colors[this.terrainType] || '#808080';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// Level class to manage collections of platforms and game objectives
export class Level {
  constructor(levelConfig) {
    this.name = levelConfig.name || 'Unnamed Level';
    this.width = levelConfig.width || 1280;
    this.height = levelConfig.height || 720;
    this.background = levelConfig.background || 'backgroundTile';
    this.completed = false;
    this.startPosition = levelConfig.startPosition ? { ...levelConfig.startPosition } : { x: 100, y: 300 };

    this.grid = new SpatialHashGrid(this.width, this.height, 128);

    this.platforms = levelConfig.platforms?.map(p => {
        const platform = new Platform(p.x, p.y, p.width, p.height, p.terrainType);
        this.grid.insert(platform);
        return platform;
    }) || [];

    this.fruits = levelConfig.fruits?.map(f => {
      const fruit = {
        x: f.x, y: f.y, size: 28,
        spriteKey: f.fruitType, frame: 0,
        frameCount: 17, frameSpeed: 0.07,
        frameTimer: 0, collected: false,
        type: 'fruit'
      };
      this.grid.insert(fruit);
      return fruit;
    }) || [];

    this.totalFruitCount = this.fruits.length;
    this.collectedFruitCount = 0;

    this.checkpoints = levelConfig.checkpoints?.map(cp => {
      const checkpoint = {
        x: cp.x, y: cp.y, size: 64,
        state: 'inactive', frame: 0,
        frameCount: 26, frameSpeed: 0.07,
        frameTimer: 0, type: 'checkpoint'
      };
      this.grid.insert(checkpoint);
      return checkpoint;
    }) || [];

    this.trophy = null;
    if (levelConfig.trophy) {
      this.trophy = {
        x: levelConfig.trophy.x, y: levelConfig.trophy.y, size: 32,
        frameCount: 8, animationFrame: 0,
        animationTimer: 0, animationSpeed: 0.35,
        acquired: false, inactive: true, contactMade: false,
      };
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
    if (!this.checkpoints.length) return [];
    return this.checkpoints.filter(cp => cp.state === 'inactive');
  }

  updateFruits(dt) {
    for (let i = 0, len = this.fruits.length; i < len; ++i) {
      const fruit = this.fruits[i];
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
    if (!this.fruits.length) return [];
    const result = [];
    for (let i = 0, len = this.fruits.length; i < len; ++i) {
      if (!this.fruits[i].collected) result.push(this.fruits[i]);
    }
    return result;
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

  checkCollisionWithPlatforms(player) {
    const potentialColliders = this.grid.query(player.x, player.y, player.width, player.height)
      .filter(obj => obj.type === 'platform');
      
    for (const plat of potentialColliders) {
      if (plat.collidesWith(player.x, player.y, player.width, player.height)) return plat;
    }
    return null;
  }

  checkGroundCollision(player) {
    const potentialColliders = this.grid.query(player.x, player.y, player.width, player.height)
      .filter(obj => obj.type === 'platform');
      
    for (const platform of potentialColliders) {
      if (platform.isPlayerOnTop(player)) {
        return platform;
      }
    }
    return null;
  }

  render(ctx, assets, camera) {
    for (let i = 0, len = this.platforms.length; i < len; ++i) {
      const plat = this.platforms[i];
      if (camera.isRectVisible(plat)) {
        plat.render(ctx, assets);
      }
    }

    if (this.trophy) {
      this.updateTrophyAnimation(1 / 60);
      this.renderTrophy(ctx, assets);
    }
  }

  renderTrophy(ctx, assets) {
    const trophy = this.trophy;
    const spriteKey = 'trophy';
    const sprite = assets[spriteKey];

    if (!sprite) {
      ctx.fillStyle = trophy.acquired ? 'silver' : 'gold';
      if (trophy.inactive) {
        ctx.fillStyle = 'gray'; 
      }
      ctx.beginPath();
      ctx.arc(trophy.x, trophy.y, trophy.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏆', trophy.x, trophy.y + 5);
      return;
    }

    const frameWidth = sprite.width / trophy.frameCount;
    const frameHeight = sprite.height;
    const srcX = frameWidth * trophy.animationFrame;

    if (trophy.inactive) {
      ctx.globalAlpha = 0.5;
    }

    ctx.drawImage(
      sprite, srcX, 0, frameWidth, frameHeight,
      trophy.x - trophy.size / 2, trophy.y - trophy.size / 2,
      trophy.size, trophy.size
    );
    ctx.globalAlpha = 1.0;
  }

  updateTrophyAnimation(dt) {
    const trophy = this.trophy;
    if (!trophy) return;

    if (!trophy.inactive && !trophy.acquired) {
      trophy.animationTimer += dt;
      if (trophy.animationTimer >= trophy.animationSpeed) {
        trophy.animationTimer -= trophy.animationSpeed;
        trophy.animationFrame = (trophy.animationFrame + 1) % trophy.frameCount;
      }
    }
  }

  isCompleted() {
    if (this.fruits.length && !this.fruits.every(f => f.collected)) return false;
    return !this.trophy || this.trophy.acquired;
  }

  reset() {
    for (let i = 0, len = this.fruits.length; i < len; ++i) {
      this.fruits[i].collected = false;
      this.fruits[i].frame = 0;
      this.fruits[i].frameTimer = 0;
    }
    
    this.collectedFruitCount = 0;

    for (const cp of this.checkpoints) {
        cp.state = 'inactive';
        cp.frame = 0;
        cp.frameTimer = 0;
    }

    if (this.trophy) {
      this.trophy.acquired = false;
      this.trophy.inactive = true;
      this.trophy.animationFrame = 0;
      this.trophy.animationTimer = 0;
    }

    this.completed = false;
  }
}