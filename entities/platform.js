export class Platform {
  constructor(x, y, width, height, terrainType = 'dirt') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.terrainType = terrainType; 

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
    // Use the background from the config, with a fallback
    this.background = levelConfig.background || 'backgroundTile';
    this.completed = false;
    this.startPosition = levelConfig.startPosition ? { ...levelConfig.startPosition } : { x: 100, y: 300 };

    // Directly map platform and fruit data to their respective objects
    this.platforms = levelConfig.platforms?.map(p => new Platform(p.x, p.y, p.width, p.height, p.terrainType)) || [];
    this.fruits = levelConfig.fruits?.map(f => ({
      x: f.x,
      y: f.y,
      size: 28,
      spriteKey: f.fruitType,
      frame: 0,
      frameCount: 17,
      frameSpeed: 0.07,
      frameTimer: 0,
      collected: false
    })) || [];

    // Initialize checkpoints
    this.checkpoints = levelConfig.checkpoints?.map(cp => ({
      x: cp.x,
      y: cp.y,
      size: 48, // Standard size
      state: 'inactive', // inactive, activating, active
      frame: 0,
      frameCount: 18, // For the activation animation
      frameSpeed: 0.05,
      frameTimer: 0,
    })) || [];

    // Initialize the trophy if it exists in the config
    this.trophy = null;
    if (levelConfig.trophy) {
      this.trophy = {
        x: levelConfig.trophy.x,
        y: levelConfig.trophy.y,
        size: 32,
        frameCount: 8,
        animationFrame: 0,
        animationTimer: 0,
        animationSpeed: 0.35,
        acquired: false,
        inactive: true,
        contactMade: false,
      };
    }
  }

  // New method to update checkpoint animations
  updateCheckpoints(dt) {
    for (const cp of this.checkpoints) {
      if (cp.state === 'activating') {
        cp.frameTimer += dt;
        if (cp.frameTimer >= cp.frameSpeed) {
          cp.frameTimer -= cp.frameSpeed;
          cp.frame++;
          if (cp.frame >= cp.frameCount) {
            cp.frame = 0; // Or last frame of idle animation
            cp.state = 'active';
          }
        }
      }
    }
  }
  
  // Returns array of inactive checkpoints for collision detection
  getInactiveCheckpoints() {
    if (!this.checkpoints.length) return [];
    return this.checkpoints.filter(cp => cp.state === 'inactive');
  }

  // Efficiently update fruit animations
  updateFruits(dt) {
    for (let i = 0, len = this.fruits.length; i < len; ++i) {
      const fruit = this.fruits[i];
      if (!fruit.collected) {
        fruit.frameTimer += dt;
        if (fruit.frameTimer >= fruit.frameSpeed) {
          fruit.frameTimer -= fruit.frameSpeed; // Carry over excess time
          fruit.frame = (fruit.frame + 1) % fruit.frameCount;
        }
      }
    }
  }

  // Return array of uncollected fruits
  getActiveFruits() {
    if (!this.fruits.length) return [];
    const result = [];
    for (let i = 0, len = this.fruits.length; i < len; ++i) {
      if (!this.fruits[i].collected) result.push(this.fruits[i]);
    }
    return result;
  }

  getFruitCount() {
    let count = 0;
    for (let i = 0, len = this.fruits.length; i < len; ++i) {
      if (this.fruits[i].collected) ++count;
    }
    return count;
  }

  getTotalFruitCount() {
    return this.fruits.length;
  }

  allFruitsCollected() {
    for (let i = 0, len = this.fruits.length; i < len; ++i) {
      if (!this.fruits[i].collected) return false;
    }
    return true;
  }

  // Returns first platform colliding with player, or null
  checkCollisionWithPlatforms(player) {
    const px = player.x, py = player.y, pw = player.width, ph = player.height;
    for (let i = 0, len = this.platforms.length; i < len; ++i) {
      const plat = this.platforms[i];
      if (plat.collidesWith(px, py, pw, ph)) return plat;
    }
    return null;
  }

  checkGroundCollision(player) {
    const playerBottom = player.y + player.height;

    for (const platform of this.platforms) {
      if (platform.isPlayerOnTop(player)) {
        return platform;
      }
    }
    return null;
  }

  // MODIFIED: Efficiently render platforms; optimized with viewport culling
  render(ctx, assets, camera) {
    for (let i = 0, len = this.platforms.length; i < len; ++i) {
      const plat = this.platforms[i];
      // Culling: Only render platforms visible to the camera
      if (camera.isRectVisible(plat)) {
        plat.render(ctx, assets);
      }
    }

    // Trophy: update animation and render if present
    if (this.trophy) {
      this.updateTrophyAnimation(1 / 60); // Use fixed dt for smoothness
      this.renderTrophy(ctx, assets);
    }
  }

  renderTrophy(ctx, assets) {
    const trophy = this.trophy;
    const spriteKey = 'trophy';
    const sprite = assets[spriteKey];

    if (!sprite) {
      // Fallback rendering
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

    // Apply transparency if trophy is inactive
    if (trophy.inactive) {
      ctx.globalAlpha = 0.5;
    }

    ctx.drawImage(
      sprite,
      srcX, 0,
      frameWidth, frameHeight,
      trophy.x - trophy.size / 2, trophy.y - trophy.size / 2,
      trophy.size, trophy.size
    );

    ctx.globalAlpha = 1.0; // Reset transparency
  }

  // Efficiently update trophy animation and inactive state
  updateTrophyAnimation(dt) {
    const trophy = this.trophy;
    if (!trophy) return;

    trophy.inactive = !this.allFruitsCollected();

    // Animate only if active and not acquired
    if (!trophy.inactive && !trophy.acquired) {
      trophy.animationTimer += dt;
      if (trophy.animationTimer >= trophy.animationSpeed) {
        trophy.animationTimer -= trophy.animationSpeed; // Carry over excess time
        trophy.animationFrame = (trophy.animationFrame + 1) % trophy.frameCount;
      }
    }
  }

  // Fast check for level completion (all fruits + trophy acquired)
  isCompleted() {
    if (this.fruits.length && !this.fruits.every(f => f.collected)) return false;
    return !this.trophy || this.trophy.acquired;
  }

  // MODIFIED: Reset level state for replay; optimized for performance and checkpoints
  reset() {
    for (let i = 0, len = this.fruits.length; i < len; ++i) {
      const fruit = this.fruits[i];
      fruit.collected = false;
      fruit.frame = 0;
      fruit.frameTimer = 0;
    }

    // Reset checkpoints
    for (const cp of this.checkpoints) {
        cp.state = 'inactive';
        cp.frame = 0;
        cp.frameTimer = 0;
    }

    // Reset trophy if present
    const trophy = this.trophy;
    if (trophy) {
      trophy.acquired = false;
      trophy.inactive = true;
      trophy.animationFrame = 0;
      trophy.animationTimer = 0;
    }

    this.completed = false; // Reset completion flag
  }
}