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
      dirt: { srcX: 96, srcY: 0 },      // Dirt tile at top-left
      stone: { srcX: 0, srcY: 0 },    // Stone tile next to dirt
      wood: { srcX: 0, srcY: 64 }     // Wood tile next to stone
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
  
  // NEW: Method to update fruit animations
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
  
  // NEW: Get only active (uncollected) fruits
  getActiveFruits() {
    return this.fruits.filter(fruit => !fruit.collected);
  }
  
  // NEW: Get count of collected fruits
  getFruitCount() {
    return this.fruits.filter(fruit => fruit.collected).length;
  }
  
  // NEW: Get total fruit count
  getTotalFruitCount() {
    return this.fruits.length;
  }
  
  // NEW: Check if all fruits are collected
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
  
  // NEW: Reset level (useful for restarting)
  reset() {
    this.fruits.forEach(fruit => fruit.collected = false);
    if (this.trophy) {
      this.trophy.collected = false;
    }
    this.completed = false;
  }
}

// UPDATED: Enhanced level creation with more fruits
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
  
  // Add more fruits strategically placed throughout the level
  level.addFruit(100, 350, 'fruit_apple');     // On starting platform
  level.addFruit(375, 300, 'fruit_bananas');   // On first jump platform
  level.addFruit(600, 250, 'fruit_cherries');  // On higher platform
  level.addFruit(850, 200, 'fruit_kiwi');      // On even higher platform
  level.addFruit(1125, 150, 'fruit_melon');    // On final platform
  
  // Optional: Add some floating fruits for extra challenge
  level.addFruit(225, 320, 'fruit_orange');    // Between platforms
  level.addFruit(475, 270, 'fruit_pineapple'); // Between platforms
  level.addFruit(675, 220, 'fruit_strawberry'); // Between platforms
  
  // Add trophy at the end
  level.setTrophy(1125, 150);
  
  return level;
}

// NEW: Function to create additional levels
export function createLevel2() {
  const level = new Level("Level 2");
  
  level.startPosition = { x: 50, y: 350 };
  
  // More challenging platform layout
  level.addPlatform(0, 450, 150, 64, 'stone');
  level.addPlatform(200, 400, 100, 64, 'wood');
  level.addPlatform(400, 350, 80, 64, 'dirt');
  level.addPlatform(600, 300, 120, 64, 'stone');
  level.addPlatform(800, 250, 100, 64, 'wood');
  level.addPlatform(1000, 200, 200, 64, 'dirt');
  
  // Strategic fruit placement
  level.addFruit(75, 400, 'fruit_apple');
  level.addFruit(250, 350, 'fruit_bananas');
  level.addFruit(440, 300, 'fruit_cherries');
  level.addFruit(660, 250, 'fruit_kiwi');
  level.addFruit(850, 200, 'fruit_melon');
  level.addFruit(1100, 150, 'fruit_orange');
  
  level.setTrophy(1100, 150);
  
  return level;
}