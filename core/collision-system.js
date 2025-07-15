// Collision detection and response system
export class CollisionSystem {
  constructor() {
    // No complex setup needed for this system yet.
  }

  update(player, activeFruits, trophy, inactiveCheckpoints) {
    const newlyCollectedFruits = this.checkFruitCollisions(player, activeFruits);
    const trophyCollision = this.checkTrophyCollision(player, trophy);
    // Check for checkpoint collisions
    const checkpointCollision = this.checkCheckpointCollisions(player, inactiveCheckpoints);

    return {
      newlyCollectedFruits,
      trophyCollision,
      checkpointCollision, // Return the collided checkpoint
    };
  }

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

  checkTrophyCollision(player, trophy) {
    if (!trophy || trophy.acquired || trophy.inactive) {
      return false;
    }

    // AABB (Axis-Aligned Bounding Box) collision check
    const px = player.x, py = player.y, pw = player.width, ph = player.height;
    const tx = trophy.x - trophy.size / 2, ty = trophy.y - trophy.size / 2, ts = trophy.size;

    return (px < tx + ts && px + pw > tx && py < ty + ts && py + ph > ty);
  }
  
  //Checks for collision between the player and inactive checkpoints.
  checkCheckpointCollisions(player, inactiveCheckpoints) {
    const px = player.x, py = player.y, pw = player.width, ph = player.height;

    for (const cp of inactiveCheckpoints) {
      const cpx = cp.x - cp.size / 2, cpy = cp.y - cp.size / 2, cps = cp.size;
      if (px < cpx + cps && px + pw > cpx && py < cpy + cps && py + ph > cpy) {
        return cp; // Return the first checkpoint hit
      }
    }
    return null;
  }
}