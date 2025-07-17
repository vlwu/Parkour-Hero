// Collision detection and response system
export class CollisionSystem {
  constructor() {
    // No complex setup needed for this system yet.
  }

  update(player, level) {
    const potentialColliders = level.grid.query(player.x, player.y, player.width, player.height);
    
    const newlyCollectedFruits = this.checkFruitCollisions(player, potentialColliders);
    const trophyCollision = this.checkTrophyCollision(player, level.trophy);
    const checkpointCollision = this.checkCheckpointCollisions(player, potentialColliders);

    return {
      newlyCollectedFruits,
      trophyCollision,
      checkpointCollision,
    };
  }

  checkFruitCollisions(player, potentialColliders) {
    const collidedFruits = [];
    const px = player.x, py = player.y, pw = player.width, ph = player.height;

    for (const fruit of potentialColliders) {
      if (fruit.type === 'fruit' && !fruit.collected) {
        const fx = fruit.x - fruit.size / 2, fy = fruit.y - fruit.size / 2, fs = fruit.size;
        if (px < fx + fs && px + pw > fx && py < fy + fs && py + ph > fy) {
          collidedFruits.push(fruit);
        }
      }
    }
    return collidedFruits;
  }

  checkTrophyCollision(player, trophy) {
    if (!trophy || trophy.acquired || trophy.inactive) {
      return false;
    }

    const px = player.x, py = player.y, pw = player.width, ph = player.height;
    const tx = trophy.x - trophy.size / 2, ty = trophy.y - trophy.size / 2, ts = trophy.size;

    return (px < tx + ts && px + pw > tx && py < ty + ts && py + ph > ty);
  }
  
  checkCheckpointCollisions(player, potentialColliders) {
    const px = player.x, py = player.y, pw = player.width, ph = player.height;

    for (const cp of potentialColliders) {
      if (cp.type === 'checkpoint' && cp.state === 'inactive') {
        const cpx = cp.x - cp.size / 2, cpy = cp.y - cp.size / 2, cps = cp.size;
        if (px < cpx + cps && px + pw > cpx && py < cpy + cps && py + ph > cpy) {
          return cp;
        }
      }
    }
    return null;
  }
}