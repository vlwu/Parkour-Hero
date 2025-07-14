// Collision detection and response system
export class CollisionSystem {
  constructor() {
    // No complex setup needed for this system yet.
  }

  /**
   * The main update loop for the collision system.
   * It checks all relevant collisions and returns a report.
   * @param {Player} player - The player object.
   * @param {Level} level - The current level object, containing fruits and trophy.
   * @returns {object} A report of all collisions that occurred this frame.
   */
  update(player, level) {
    const newlyCollectedFruits = this.checkFruitCollisions(player, level.fruits);
    const trophyCollision = this.checkTrophyCollision(player, level.trophy);

    return {
      newlyCollectedFruits,
      trophyCollision,
    };
  }

  /**
   * Checks for collisions between the player and an array of fruits.
   * @param {Player} player
   * @param {Array<Fruit>} fruits
   * @returns {Array<Fruit>} An array of fruits the player has just collided with.
   */
  checkFruitCollisions(player, fruits) {
    const collidedFruits = [];
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    for (const fruit of fruits) {
      if (fruit.collected) continue;

      const dx = fruit.x - playerCenterX;
      const dy = fruit.y - playerCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const collisionDistance = fruit.size / 2 + player.width / 2; // Simple circular approximation

      if (distance < collisionDistance) {
        collidedFruits.push(fruit);
      }
    }
    return collidedFruits;
  }

  /**
   * Checks for collision between the player and the level's trophy.
   * @param {Player} player
   *p   * @param {Trophy} trophy
   * @returns {boolean} True if a collision occurred, otherwise false.
   */
  checkTrophyCollision(player, trophy) {
    if (!trophy || trophy.acquired || trophy.inactive) {
      return false;
    }

    // AABB (Axis-Aligned Bounding Box) collision check
    const px = player.x, py = player.y, pw = player.width, ph = player.height;
    const tx = trophy.x - trophy.size / 2, ty = trophy.y - trophy.size / 2, ts = trophy.size;

    return (px < tx + ts && px + pw > tx && py < ty + ts && py + ph > ty);
  }
}