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
      sand: { srcX: 0, srcY: 0 },  
      mud: { srcX: 64, srcY: 0 },    
      ice: { srcX: 128, srcY: 0 },   
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
}