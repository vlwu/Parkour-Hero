export class Platform {
  constructor(x, y, width, height, terrainType = 'dirt') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.terrainType = terrainType; // 'dirt', 'stone', 'wood'

    // Sprite sheet configuration for terrain tiles
    this.spriteConfig = {
      dirt: { srcX: 96, srcY: 0 },      // Dirt tile at top-left
      stone: { srcX: 0, srcY: 0 },    // Stone tile next to dirt
      wood: { srcX: 0, srcY: 64 },     // Wood tile next to stone
      green_block: { srcX: 0, srcY: 128 }, // Green block tile
      orange_dirt: { srcX: 96, srcY: 64 }, // Oranges dirt tile
      pink_dirt: { srcX: 96, srcY: 128 }, // Pink dirt tile
      red_brick: { srcX: 272, srcY: 64 }, // Red brick tile
    };

    this.tileSize = 48; // Size of each tile in the spritesheet
  }

  // Check if a point or rectangle collides with this platform
  collidesWith(x, y, width = 0, height = 0) {
    return x < this.x + this.width &&
           x + width > this.x &&
           y < this.y + this.height &&
           y + height > this.y;
  }

  // Check if the player is standing on top of this platform
  isPlayerOnTop(player) {
    const playerBottom = player.y + player.height;
    const platformTop = this.y;

    // Player must be above the platform and within horizontal bounds
    return playerBottom >= platformTop &&
           playerBottom <= platformTop + 10 && // Allow some tolerance
           player.x + player.width > this.x &&
           player.x < this.x + this.width;
  }

  render(ctx, assets) {
    try {
      const terrainSprite = assets.block;

      if (!terrainSprite) {
        // Fallback rendering if sprite not available
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
          this.tileSize, this.tileSize, // Source tile is always full
          tileX, this.y,
          this.tileSize, this.tileSize  // Draw full tile
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
      dirt: '#8B4513',    // Brown
      stone: '#696969',   // Gray
      wood: '#D2691E'     // Orange-brown
    };

    ctx.fillStyle = colors[this.terrainType] || '#808080';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// Level class to manage collections of platforms and game objectives
export class Level {
  constructor(name, backgrounds = ['backgroundTile']) {
    this.name = name;
    this.platforms = [];
    this.fruits = [];
    this.trophy = null;
    this.backgrounds = backgrounds;
    this.completed = false;
    this.startPosition = { x: 100, y: 300 }; // Default player starting position
  }

  addPlatform(x, y, width, height, terrainType = 'dirt') {
    const platform = new Platform(x, y, width, height, terrainType);
    this.platforms.push(platform);
    return platform;
  }

  addFruit(x, y, fruitType) {
    this.fruits.push({
      x: x,
      y: y,
      size: 28,
      spriteKey: fruitType,
      frame: 0,
      frameCount: 17,
      frameSpeed: 0.07,
      frameTimer: 0,
      collected: false
    });
  }

  setTrophy(x, y) {
    this.trophy = {
      x: x,
      y: y,
      size: 32,
      frameCount: 8,
      animationFrame: 0,
      animationTimer: 0,
      animationSpeed: 0.35, // seconds between frames
      acquired: false,
      inactive: false, // Added inactive state
    };
  }

  // Method to update fruit animations
  updateFruits(dt) {
    this.fruits.forEach(fruit => {
      if (!fruit.collected) {
        fruit.frameTimer += dt;
        if (fruit.frameTimer >= fruit.frameSpeed) {
          fruit.frameTimer = 0;
          fruit.frame = (fruit.frame + 1) % fruit.frameCount;
        }
      }
    });
  }

  // Get only active (uncollected) fruits
  getActiveFruits() {
    return this.fruits.filter(fruit => !fruit.collected);
  }

  // Get count of collected fruits
  getFruitCount() {
    return this.fruits.filter(fruit => fruit.collected).length;
  }

  // Get total fruit count
  getTotalFruitCount() {
    return this.fruits.length;
  }

  // Check if all fruits are collected
  allFruitsCollected() {
    return this.fruits.every(fruit => fruit.collected);
  }

  checkCollisionWithPlatforms(player) {
    for (const platform of this.platforms) {
      if (platform.collidesWith(player.x, player.y, player.width, player.height)) {
        return platform;
      }
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

  render(ctx, assets, camera) {
    // Render all platforms
    for (const platform of this.platforms) {
      platform.render(ctx, assets);
    }

    // Update and render trophy regardless of acquisition status
    if (this.trophy) {
      this.updateTrophyAnimation(1 / 60); // Ideally pass `dt`, but fallback here
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
        ctx.fillStyle = 'gray'; // Show inactive trophy differently
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
      ctx.globalAlpha = 0.5; // Make trophy semi-transparent
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

  updateTrophyAnimation(dt) {
    const trophy = this.trophy;
    if (!trophy) return;
    
    trophy.inactive = !this.allFruitsCollected(); // Only animate if trophy is active and not acquired
    
    if (!trophy.inactive && !trophy.acquired) {
      trophy.animationTimer += dt;
      if (trophy.animationTimer >= trophy.animationSpeed) {
        trophy.animationTimer = 0;
        trophy.animationFrame = (trophy.animationFrame + 1) % trophy.frameCount;
      }
    }
  }

  isCompleted() {
    const allFruitsCollected = this.fruits.every(fruit => fruit.collected);
    const trophyCollected = this.trophy ? this.trophy.acquired : true;

    return allFruitsCollected && trophyCollected;
  }

  // Reset level
  reset() {
    this.fruits.forEach(fruit => fruit.collected = false);
    if (this.trophy) {
      this.trophy.acquired = false;
      this.trophy.inactive = false;
    }
    this.completed = false;
  }
}

/**
 * Creates a Level object from a level configuration object.
 * @param {object} levelConfig - The configuration object for the level.
 * @returns {Level} The constructed Level object.
 */
export function createLevel(levelConfig) {
  const level = new Level(levelConfig.name, levelConfig.backgrounds);
  level.startPosition = { ...levelConfig.startPosition }; // Deep copy start position

  // Add platforms based on configuration
  levelConfig.platforms?.forEach(p => {
    level.addPlatform(p.x, p.y, p.width, p.height, p.terrainType);
  });

  // Add fruits based on configuration
  levelConfig.fruits?.forEach(f => {
    level.addFruit(f.x, f.y, f.fruitType);
  });

  // Set trophy based on configuration
  if (levelConfig.trophy) {
    level.setTrophy(levelConfig.trophy.x, levelConfig.trophy.y);
  }

  return level;
}