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

    ctx.drawImage(
      sprite,
      srcX, 0,
      frameWidth, frameHeight,
      trophy.x - trophy.size / 2, trophy.y - trophy.size / 2,
      trophy.size, trophy.size
    );
  }

  updateTrophyAnimation(dt) {
    const trophy = this.trophy;
    if (!trophy) return;

    trophy.animationTimer += dt;
    if (trophy.animationTimer >= trophy.animationSpeed && !trophy.acquired) {
      trophy.animationTimer = 0;
      trophy.animationFrame = (trophy.animationFrame + 1) % trophy.frameCount; // 8 frames in the sprite sheet
    }
  }

  isCompleted() {
    // TODO: Level is completed when all fruits are collected and trophy is obtained, but trophy can only be acquired after all fruits are collected
    const allFruitsCollected = this.fruits.every(fruit => fruit.collected);
    const trophyCollected = this.trophy ? this.trophy.acquired : true;

    // Only allow completion if all fruits are collected and trophy is acquired
    return allFruitsCollected && trophyCollected;
  }

  // Reset level (useful for restarting)
  reset() {
    this.fruits.forEach(fruit => fruit.collected = false);
    if (this.trophy) {
      this.trophy.acquired = false;
    }
    this.completed = false;
  }
}

// Define level data as sections (each section is an array of levels)
export const levelSections = [
  // Section 1 (Tutorial and Basic Mechanics)
  [
    {
    name: "Level 1: It's Too Easy",
    startPosition: { x: 50, y: 300 },
    platforms: [
      { x: 0, y: 400, width: 192, height: 48, terrainType: 'dirt' },
      { x: 300, y: 350, width: 144, height: 48, terrainType: 'wood' },
      { x: 550, y: 300, width: 96, height: 48, terrainType: 'stone' },
      { x: 750, y: 250, width: 192, height: 48, terrainType: 'dirt' },
      { x: 1050, y: 350, width: 144, height: 48, terrainType: 'wood' }
    ],
    fruits: [
      { x: 100, y: 275, fruitType: 'fruit_apple' },
      { x: 375, y: 300, fruitType: 'fruit_bananas' },
      { x: 600, y: 250, fruitType: 'fruit_cherries' },
      { x: 850, y: 200, fruitType: 'fruit_kiwi' },
      { x: 1000, y: 150, fruitType: 'fruit_melon' },
      { x: 225, y: 320, fruitType: 'fruit_orange' },
      { x: 475, y: 270, fruitType: 'fruit_pineapple' },
      { x: 675, y: 220, fruitType: 'fruit_strawberry' }
    ],
    trophy: { x: 1125, y: 350 - 16 }
    },
    {
      name: "Level 2: Annoying Drop",
      startPosition: { x: 50, y: 350 },
      platforms: [
        { x: 0, y: 400, width: 192, height: 48, terrainType: 'dirt' },
        { x: 300, y: 320, width: 96, height: 48, terrainType: 'stone' },
        { x: 450, y: 240, width: 144, height: 48, terrainType: 'wood' },
        { x: 700, y: 160, width: 144, height: 48, terrainType: 'dirt' },
        { x: 1000, y: 600, width: 144, height: 48, terrainType: 'stone' }
      ],
      fruits: [
        { x: 75, y: 250, fruitType: 'fruit_apple' },
        { x: 300, y: 270, fruitType: 'fruit_bananas' },
        { x: 525, y: 190, fruitType: 'fruit_cherries' },
        { x: 800, y: 110, fruitType: 'fruit_kiwi' },
        { x: 1000, y: 100, fruitType: 'fruit_melon' },
        { x: 250, y: 500, fruitType: 'fruit_orange' },
        { x: 650, y: 110, fruitType: 'fruit_pineapple' },
        { x: 950, y: 190, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1120, y: 600 - 16 }
    },
    {
      name: "Level 3: Canyon Dash",
      startPosition: { x: 50, y: 350 },
      platforms: [
        { x: 0, y: 400, width: 144, height: 48, terrainType: 'dirt' },
        { x: 200, y: 350, width: 96, height: 48, terrainType: 'wood' },
        { x: 350, y: 500, width: 96, height: 48, terrainType: 'stone' }, 
        { x: 600, y: 350, width: 96, height: 48, terrainType: 'dirt' },   
        { x: 800, y: 250, width: 144, height: 48, terrainType: 'wood' },
        { x: 1050, y: 300, width: 192, height: 48, terrainType: 'stone' }
      ],
      fruits: [
        { x: 50, y: 250, fruitType: 'fruit_apple' },
        { x: 240, y: 300, fruitType: 'fruit_bananas' },
        { x: 230, y: 450, fruitType: 'fruit_cherries' },
        { x: 650, y: 300, fruitType: 'fruit_kiwi' },
        { x: 850, y: 200, fruitType: 'fruit_melon' },
        { x: 1150, y: 250, fruitType: 'fruit_orange' },
        { x: 500, y: 450, fruitType: 'fruit_pineapple' },
        { x: 1000, y: 300, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1200, y: 284 }
    },
    {
      name: "Level 4: Sky Climb",
      startPosition: { x: 50, y: 600 },
      platforms: [
        { x: 0, y: 650, width: 192, height: 48, terrainType: 'dirt' },
        { x: 200, y: 550, width: 96, height: 48, terrainType: 'stone' },
        { x: 350, y: 450, width: 144, height: 48, terrainType: 'wood' },
        { x: 550, y: 350, width: 96, height: 48, terrainType: 'dirt' },
        { x: 700, y: 250, width: 192, height: 48, terrainType: 'stone' },
        { x: 950, y: 150, width: 144, height: 48, terrainType: 'wood' }
      ],
      fruits: [
        { x: 100, y: 450, fruitType: 'fruit_apple' },
        { x: 240, y: 500, fruitType: 'fruit_bananas' },
        { x: 400, y: 400, fruitType: 'fruit_cherries' },
        { x: 600, y: 300, fruitType: 'fruit_kiwi' },
        { x: 800, y: 200, fruitType: 'fruit_melon' },
        { x: 1020, y: 50, fruitType: 'fruit_orange' },
        { x: 500, y: 400, fruitType: 'fruit_pineapple' },
        { x: 900, y: 100, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1020, y: 134 }
    },
    {
      name: "Level 5: Colorful Blocks",
      startPosition: { x: 50, y: 350 },
      platforms: [
        { x: 0, y: 400, width: 144, height: 48, terrainType: 'green_block' },
        { x: 200, y: 350, width: 96, height: 48, terrainType: 'orange_dirt' },
        { x: 350, y: 300, width: 144, height: 48, terrainType: 'pink_dirt' },
        { x: 550, y: 400, width: 192, height: 48, terrainType: 'red_brick' }, // Drop-down
        { x: 800, y: 250, width: 144, height: 48, terrainType: 'green_block' },
        { x: 1050, y: 300, width: 96, height: 48, terrainType: 'red_brick' }
      ],
      fruits: [
        { x: 80, y: 300, fruitType: 'fruit_apple' },
        { x: 240, y: 300, fruitType: 'fruit_bananas' },
        { x: 420, y: 250, fruitType: 'fruit_cherries' },
        { x: 630, y: 350, fruitType: 'fruit_kiwi' },
        { x: 870, y: 200, fruitType: 'fruit_melon' },
        { x: 1200, y: 175, fruitType: 'fruit_orange' },
        { x: 800, y: 320, fruitType: 'fruit_pineapple' },
        { x: 1000, y: 350, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1080, y: 284 }
    },
    {
      name: "Level 6: Narrow Paths",
      startPosition: { x: 50, y: 350 },
      platforms: [
        { x: 0, y: 400, width: 96, height: 48, terrainType: 'dirt' },
        { x: 150, y: 350, width: 48, height: 48, terrainType: 'stone' },
        { x: 250, y: 300, width: 48, height: 48, terrainType: 'wood' },
        { x: 350, y: 500, width: 48, height: 48, terrainType: 'red_brick' },
        { x: 450, y: 250, width: 48, height: 48, terrainType: 'green_block' },
        { x: 600, y: 400, width: 48, height: 48, terrainType: 'pink_dirt' },
        { x: 750, y: 300, width: 96, height: 48, terrainType: 'orange_dirt' },
        { x: 950, y: 200, width: 144, height: 48, terrainType: 'stone' }
      ],
      fruits: [
        { x: 180, y: 300, fruitType: 'fruit_apple' },
        { x: 280, y: 250, fruitType: 'fruit_bananas' },
        { x: 380, y: 450, fruitType: 'fruit_cherries' },
        { x: 480, y: 200, fruitType: 'fruit_kiwi' },
        { x: 630, y: 350, fruitType: 'fruit_melon' },
        { x: 800, y: 250, fruitType: 'fruit_orange' },
        { x: 950, y: 300, fruitType: 'fruit_pineapple' },
        { x: 550, y: 350, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1020, y: 184 }
    },
    {
      name: "Level 7: Stairway",
      startPosition: { x: 50, y: 600 },
      platforms: [
        { x: 0, y: 650, width: 144, height: 48, terrainType: 'dirt' },
        { x: 200, y: 550, width: 144, height: 48, terrainType: 'wood' },
        { x: 400, y: 450, width: 144, height: 48, terrainType: 'stone' },
        { x: 600, y: 350, width: 144, height: 48, terrainType: 'green_block' },
        { x: 800, y: 250, width: 144, height: 48, terrainType: 'orange_dirt' },
        { x: 1000, y: 150, width: 144, height: 48, terrainType: 'red_brick' }
      ],
      fruits: [
        { x: 80, y: 500, fruitType: 'fruit_apple' },
        { x: 270, y: 650, fruitType: 'fruit_bananas' },
        { x: 470, y: 600, fruitType: 'fruit_cherries' },
        { x: 300, y: 250, fruitType: 'fruit_kiwi' },
        { x: 870, y: 220, fruitType: 'fruit_melon' },
        { x: 1070, y: 250, fruitType: 'fruit_orange' },
        { x: 350, y: 400, fruitType: 'fruit_pineapple' },
        { x: 600, y: 100, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1070, y: 134 }
    },
    {
      name: "Level 8: Bottomless",
      startPosition: { x: 50, y: 300 },
      platforms: [
        { x: 0, y: 400, width: 96, height: 48, terrainType: 'dirt' },
        { x: 200, y: 500, width: 96, height: 48, terrainType: 'stone' },   // Lower
        { x: 350, y: 350, width: 96, height: 48, terrainType: 'wood' },    // Requires dash
        { x: 500, y: 500, width: 96, height: 48, terrainType: 'red_brick' },
        { x: 700, y: 300, width: 48, height: 48, terrainType: 'green_block' },
        { x: 900, y: 450, width: 96, height: 48, terrainType: 'pink_dirt' },
        { x: 1100, y: 350, width: 144, height: 48, terrainType: 'orange_dirt' }
      ],
      fruits: [
        { x: 40, y: 350, fruitType: 'fruit_apple' },
        { x: 240, y: 450, fruitType: 'fruit_bananas' },
        { x: 390, y: 300, fruitType: 'fruit_cherries' },
        { x: 540, y: 450, fruitType: 'fruit_kiwi' },
        { x: 770, y: 250, fruitType: 'fruit_melon' },
        { x: 950, y: 400, fruitType: 'fruit_orange' },
        { x: 1170, y: 200, fruitType: 'fruit_pineapple' },
        { x: 650, y: 450, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1170, y: 334 }
    },
    {
      name: "Level 9: Aerial Mastery",
      startPosition: { x: 50, y: 250 },
      platforms: [
        { x: 0, y: 300, width: 96, height: 48, terrainType: 'dirt' },
        { x: 150, y: 200, width: 48, height: 48, terrainType: 'stone' },   // High jump
        { x: 250, y: 350, width: 48, height: 48, terrainType: 'wood' },    // Drop-down
        { x: 400, y: 150, width: 96, height: 48, terrainType: 'green_block' }, // Double jump
        { x: 600, y: 250, width: 48, height: 48, terrainType: 'red_brick' },   // Dash required
        { x: 750, y: 180, width: 96, height: 48, terrainType: 'orange_dirt' },
        { x: 950, y: 300, width: 48, height: 48, terrainType: 'pink_dirt' },
        { x: 1100, y: 220, width: 144, height: 48, terrainType: 'stone' }
      ],
      fruits: [
        { x: 180, y: 150, fruitType: 'fruit_apple' },
        { x: 280, y: 300, fruitType: 'fruit_bananas' },
        { x: 440, y: 100, fruitType: 'fruit_cherries' },
        { x: 630, y: 200, fruitType: 'fruit_kiwi' },
        { x: 790, y: 130, fruitType: 'fruit_melon' },
        { x: 980, y: 250, fruitType: 'fruit_orange' },
        { x: 1150, y: 100, fruitType: 'fruit_pineapple' },
        { x: 500, y: 300, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1170, y: 204 }
    },
    {
      name: "Level 10: Introduction Finale",
      startPosition: { x: 50, y: 350 },
      platforms: [
        { x: 0, y: 400, width: 96, height: 48, terrainType: 'dirt' },
        { x: 200, y: 500, width: 96, height: 48, terrainType: 'stone' },
        { x: 350, y: 350, width: 48, height: 48, terrainType: 'wood' },      // Precision
        { x: 500, y: 250, width: 144, height: 48, terrainType: 'red_brick' }, // High dash
        { x: 700, y: 400, width: 96, height: 48, terrainType: 'green_block' },// Drop-down
        { x: 900, y: 300, width: 144, height: 48, terrainType: 'orange_dirt' },
        { x: 1100, y: 200, width: 96, height: 48, terrainType: 'pink_dirt' }  // Final stretch
      ],
      fruits: [
        { x: 40, y: 350, fruitType: 'fruit_apple' },
        { x: 240, y: 450, fruitType: 'fruit_bananas' },
        { x: 380, y: 300, fruitType: 'fruit_cherries' },
        { x: 570, y: 200, fruitType: 'fruit_kiwi' },
        { x: 740, y: 350, fruitType: 'fruit_melon' },
        { x: 970, y: 250, fruitType: 'fruit_orange' },
        { x: 1150, y: 150, fruitType: 'fruit_pineapple' },
        { x: 650, y: 350, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1140, y: 184 }
    },
  ],
  // Section 2 (placeholder)
  [
    {
      name: 'Level 11: New Beginnings',
    },
  ],
];

/**
 * Creates a Level object from a level configuration object.
 * @param {object} levelConfig - The configuration object for the level.
 * @returns {Level} The constructed Level object.
 */
export function createLevel(levelConfig) {
  const level = new Level(levelConfig.name, levelConfig.backgrounds);
  level.startPosition = { ...levelConfig.startPosition }; // Deep copy start position

  // Add platforms based on configuration
  levelConfig.platforms.forEach(p => {
    level.addPlatform(p.x, p.y, p.width, p.height, p.terrainType);
  });

  // Add fruits based on configuration
  levelConfig.fruits.forEach(f => {
    level.addFruit(f.x, f.y, f.fruitType);
  });

  // Set trophy based on configuration
  if (levelConfig.trophy) {
    level.setTrophy(levelConfig.trophy.x, levelConfig.trophy.y);
  }

  return level;
}
