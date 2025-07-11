// entities/platform.js
export class Platform {
  constructor(x, y, width, height, terrainType = 'dirt') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.terrainType = terrainType; // 'dirt', 'stone', 'wood'
    
    // Sprite sheet configuration for terrain tiles
    this.spriteConfig = {
      dirt: { srcX: 0, srcY: 0 },     // Top-left of spritesheet
      stone: { srcX: 64, srcY: 0 },   // Adjust based on your spritesheet layout
      wood: { srcX: 128, srcY: 0 }    // Adjust based on your spritesheet layout
    };
    
    this.tileSize = 64; // Size of each tile in the spritesheet
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
      const tilesNeeded = Math.ceil(this.width / this.tileSize);
      
      // Draw repeated tiles across the platform width
      for (let i = 0; i < tilesNeeded; i++) {
        const tileX = this.x + (i * this.tileSize);
        const tileWidth = Math.min(this.tileSize, this.width - (i * this.tileSize));
        
        ctx.drawImage(
          terrainSprite,
          config.srcX, config.srcY,           // Source position in spritesheet
          tileWidth, this.tileSize,           // Source dimensions
          tileX, this.y,                      // Destination position
          tileWidth, this.height              // Destination dimensions
        );
      }
      
      // Debug outline (remove in production)
      if (false) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
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
      collected: false
    };
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
    
    // Render trophy if it exists and hasn't been collected
    if (this.trophy && !this.trophy.collected) {
      this.renderTrophy(ctx, assets);
    }
  }
  
  renderTrophy(ctx, assets) {
    // Simple trophy rendering - you can replace with sprite when available
    ctx.fillStyle = 'gold';
    ctx.beginPath();
    ctx.arc(this.trophy.x, this.trophy.y, this.trophy.size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆', this.trophy.x, this.trophy.y + 5);
  }
  
  isCompleted() {
    // Level is completed when all fruits are collected and trophy is obtained
    const allFruitsCollected = this.fruits.every(fruit => fruit.collected);
    const trophyCollected = this.trophy ? this.trophy.collected : true;
    
    return allFruitsCollected && trophyCollected;
  }
}

// Example level creation
export function createLevel1() {
  const level = new Level("Level 1");
  
  // Set player starting position
  level.startPosition = { x: 50, y: 300 };
  
  // Add platforms - creating a simple parkour course
  level.addPlatform(0, 400, 200, 64, 'dirt');        // Starting platform
  level.addPlatform(300, 350, 150, 64, 'wood');      // First jump
  level.addPlatform(550, 300, 100, 64, 'stone');     // Higher platform
  level.addPlatform(750, 250, 200, 64, 'dirt');      // Even higher
  level.addPlatform(1050, 200, 150, 64, 'wood');     // Final platform
  
  // Add some fruits to collect
  level.addFruit(350, 300, 'fruit_apple');
  level.addFruit(600, 250, 'fruit_bananas');
  level.addFruit(800, 200, 'fruit_cherries');
  
  // Add trophy at the end
  level.setTrophy(1125, 150);
  
  return level;
}