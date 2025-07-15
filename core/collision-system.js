// Collision detection and response system
export class CollisionSystem {
  constructor() {
    // No complex setup needed for this system yet.
  }

  /**
   * The main update loop for the collision system.
   * It checks all relevant collisions and returns a report.
   * @param {Player} player - The player object.
   * @param {Array<Fruit>} activeFruits - An array of uncollected fruits.
   * @param {Trophy} trophy - The current level's trophy object.
   * @returns {object} A report of all collisions that occurred this frame.
   */
  update(player, activeFruits, trophy) {
    const newlyCollectedFruits = this.checkFruitCollisions(player, activeFruits);
    const trophyCollision = this.checkTrophyCollision(player, trophy);

    return {
      newlyCollectedFruits,
      trophyCollision,
    };
  }

  /**
   * Checks for collisions between the player and an array of active fruits using AABB.
   * @param {Player} player
   * @param {Array<Fruit>} activeFruits - IMPORTANT: Should only contain uncollected fruits.
   * @returns {Array<Fruit>} An array of fruits the player has just collided with.
   */
  checkFruitCollisions(player, activeFruits) {
    const collidedFruits = [];
    const px = player.x, py = player.y, pw = player.width, ph = player.height;

    for (const fruit of activeFruits) {
      // AABB check is much faster than Math.sqrt
      const fx = fruit.x - fruit.size / 2, fy = fruit.y - fruit.size / 2, fs = fruit.size;
      if (px < fx + fs && px + pw > fx && py < fy + fs && py + ph > fy) {
        collidedFruits.push(fruit);
      }
    }
    return collidedFruits;
  }

  /**
   * Checks for collision between the player and the level's trophy.
   * @param {Player} player
   * @param {Trophy} trophy
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