export class CollisionManager {
  constructor() {
    this.collisionPadding = 0.1;
  }

  updateCollisions(gameState, soundManager, camera) {
    const player = gameState.getPlayer();
    const currentLevel = gameState.getCurrentLevel();
    
    if (!player || !currentLevel) return;

    // Check platform collisions
    this.checkPlatformCollisions(player, currentLevel);
    
    // Check wall collisions
    this.checkWallCollisions(player, currentLevel);
    
    // Check spike collisions
    this.checkSpikeCollisions(player, currentLevel, soundManager, camera);
    
    // Check fruit collisions
    this.checkFruitCollisions(player, currentLevel, soundManager);
    
    // Check trophy collision
    this.checkTrophyCollision(player, currentLevel, soundManager);
    
    // Check enemy collisions
    this.checkEnemyCollisions(player, currentLevel, soundManager, camera);
    
    // Check moving platform collisions
    this.checkMovingPlatformCollisions(player, currentLevel);
    
    // Check checkpoint collisions
    this.checkCheckpointCollisions(player, currentLevel, soundManager);
    
    // Check level boundaries
    this.checkLevelBoundaries(player, currentLevel);
  }

  checkPlatformCollisions(player, level) {
    if (!level.platforms) return;

    level.platforms.forEach(platform => {
      if (this.checkAABBCollision(player, platform)) {
        this.resolvePlatformCollision(player, platform);
      }
    });
  }

  checkWallCollisions(player, level) {
    if (!level.walls) return;

    level.walls.forEach(wall => {
      if (this.checkAABBCollision(player, wall)) {
        this.resolveWallCollision(player, wall);
      }
    });
  }

  checkSpikeCollisions(player, level, soundManager, camera) {
    if (!level.spikes) return;

    level.spikes.forEach(spike => {
      if (this.checkAABBCollision(player, spike)) {
        player.needsRespawn = true;
        camera.shake(15, 0.5);
        soundManager.play('death_sound');
      }
    });
  }

  checkFruitCollisions(player, level, soundManager) {
    if (!level.fruits) return;

    level.fruits.forEach(fruit => {
      if (!fruit.collected && this.checkAABBCollision(player, fruit)) {
        fruit.collected = true;
        level.fruitsCollected++;
        soundManager.play('fruit_collect', 0.6);
        
        // Start collection animation
        fruit.animationScale = 1.2;
        fruit.animationTimer = 0.3;
      }
    });
  }

  checkTrophyCollision(player, level, soundManager) {
    if (!level.trophy || level.trophy.collected) return;

    if (this.checkAABBCollision(player, level.trophy)) {
      level.trophy.collected = true;
      soundManager.play('trophy_collect', 0.8);
    }
  }

  checkEnemyCollisions(player, level, soundManager, camera) {
    if (!level.enemies) return;

    level.enemies.forEach(enemy => {
      if (!enemy.defeated && this.checkAABBCollision(player, enemy)) {
        if (player.isDashing) {
          // Player defeats enemy while dashing
          enemy.defeated = true;
          soundManager.play('enemy_defeat', 0.7);
          camera.shake(8, 0.3);
          
          // Add particle effect or animation
          enemy.deathAnimationTimer = 0.5;
        } else {
          // Enemy defeats player
          player.needsRespawn = true;
          camera.shake(15, 0.5);
          soundManager.play('death_sound');
        }
      }
    });
  }

  checkMovingPlatformCollisions(player, level) {
    if (!level.movingPlatforms) return;

    level.movingPlatforms.forEach(platform => {
      if (this.checkAABBCollision(player, platform)) {
        this.resolvePlatformCollision(player, platform);
        
        // Move player with platform
        if (player.isGrounded && Math.abs(player.velocity.y) < 0.1) {
          player.x += platform.velocity.x;
          player.y += platform.velocity.y;
        }
      }
    });
  }

  checkCheckpointCollisions(player, level, soundManager) {
    if (!level.checkpoints) return;

    level.checkpoints.forEach(checkpoint => {
      if (!checkpoint.activated && this.checkAABBCollision(player, checkpoint)) {
        checkpoint.activated = true;
        level.lastCheckpoint = checkpoint;
        soundManager.play('checkpoint', 0.5);
      }
    });
  }

  checkLevelBoundaries(player, level) {
    const levelWidth = level.width || 1280;
    const levelHeight = level.height || 720;
    
    // Check if player falls below level
    if (player.y > levelHeight + 100) {
      player.needsRespawn = true;
    }
    
    // Keep player within horizontal bounds
    if (player.x < player.width / 2) {
      player.x = player.width / 2;
      player.velocity.x = 0;
    } else if (player.x > levelWidth - player.width / 2) {
      player.x = levelWidth - player.width / 2;
      player.velocity.x = 0;
    }
  }

  checkAABBCollision(objA, objB) {
    const aLeft = objA.x - objA.width / 2;
    const aRight = objA.x + objA.width / 2;
    const aTop = objA.y - objA.height / 2;
    const aBottom = objA.y + objA.height / 2;
    
    const bLeft = objB.x - objB.width / 2;
    const bRight = objB.x + objB.width / 2;
    const bTop = objB.y - objB.height / 2;
    const bBottom = objB.y + objB.height / 2;
    
    return (
      aLeft < bRight &&
      aRight > bLeft &&
      aTop < bBottom &&
      aBottom > bTop
    );
  }

  resolvePlatformCollision(player, platform) {
    const playerLeft = player.x - player.width / 2;
    const playerRight = player.x + player.width / 2;
    const playerTop = player.y - player.height / 2;
    const playerBottom = player.y + player.height / 2;
    
    const platformLeft = platform.x;
    const platformRight = platform.x + platform.width;
    const platformTop = platform.y;
    const platformBottom = platform.y + platform.height;
    
    // Calculate overlap on each axis
    const overlapLeft = playerRight - platformLeft;
    const overlapRight = platformRight - playerLeft;
    const overlapTop = playerBottom - platformTop;
    const overlapBottom = platformBottom - playerTop;
    
    // Find minimum overlap
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
    
    // Resolve collision based on minimum overlap
    if (minOverlap === overlapTop && player.velocity.y > 0) {
      // Landing on top of platform
      player.y = platformTop - player.height / 2;
      player.velocity.y = 0;
      player.isGrounded = true;
      player.canJump = true;
      player.canDash = true;
    } else if (minOverlap === overlapBottom && player.velocity.y < 0) {
      // Hitting platform from below
      player.y = platformBottom + player.height / 2;
      player.velocity.y = 0;
    } else if (minOverlap === overlapLeft && player.velocity.x > 0) {
      // Hitting platform from the left
      player.x = platformLeft - player.width / 2;
      player.velocity.x = 0;
    } else if (minOverlap === overlapRight && player.velocity.x < 0) {
      // Hitting platform from the right
      player.x = platformRight + player.width / 2;
      player.velocity.x = 0;
    }
  }

  resolveWallCollision(player, wall) {
    const playerLeft = player.x - player.width / 2;
    const playerRight = player.x + player.width / 2;
    const playerTop = player.y - player.height / 2;
    const playerBottom = player.y + player.height / 2;
    
    const wallLeft = wall.x;
    const wallRight = wall.x + wall.width;
    const wallTop = wall.y;
    const wallBottom = wall.y + wall.height;
    
    // Calculate overlap on each axis
    const overlapLeft = playerRight - wallLeft;
    const overlapRight = wallRight - playerLeft;
    const overlapTop = playerBottom - wallTop;
    const overlapBottom = wallBottom - playerTop;
    
    // Find minimum overlap
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
    
    // Resolve collision based on minimum overlap
    if (minOverlap === overlapTop && player.velocity.y > 0) {
      // Landing on top of wall
      player.y = wallTop - player.height / 2;
      player.velocity.y = 0;
      player.isGrounded = true;
      player.canJump = true;
      player.canDash = true;
    } else if (minOverlap === overlapBottom && player.velocity.y < 0) {
      // Hitting wall from below
      player.y = wallBottom + player.height / 2;
      player.velocity.y = 0;
    } else if (minOverlap === overlapLeft && player.velocity.x > 0) {
      // Hitting wall from the left
      player.x = wallLeft - player.width / 2;
      player.velocity.x = 0;
      
      // Enable wall jumping
      if (!player.isGrounded) {
        player.canWallJump = true;
        player.wallJumpTimer = 0.2;
      }
    } else if (minOverlap === overlapRight && player.velocity.x < 0) {
      // Hitting wall from the right
      player.x = wallRight + player.width / 2;
      player.velocity.x = 0;
      
      // Enable wall jumping
      if (!player.isGrounded) {
        player.canWallJump = true;
        player.wallJumpTimer = 0.2;
      }
    }
  }

  // Utility functions for more complex collision detection
  checkCircleCollision(objA, objB) {
    const dx = objA.x - objB.x;
    const dy = objA.y - objB.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (objA.radius + objB.radius);
  }

  checkPointInRect(point, rect) {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  getCollisionNormal(objA, objB) {
    const dx = objA.x - objB.x;
    const dy = objA.y - objB.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return { x: 0, y: -1 };
    
    return {
      x: dx / length,
      y: dy / length
    };
  }

  // Sweep collision detection for fast-moving objects
  sweepAABB(objA, objB, velocity) {
    const dx = velocity.x;
    const dy = velocity.y;
    
    if (dx === 0 && dy === 0) return null;
    
    const aLeft = objA.x - objA.width / 2;
    const aRight = objA.x + objA.width / 2;
    const aTop = objA.y - objA.height / 2;
    const aBottom = objA.y + objA.height / 2;
    
    const bLeft = objB.x - objB.width / 2;
    const bRight = objB.x + objB.width / 2;
    const bTop = objB.y - objB.height / 2;
    const bBottom = objB.y + objB.height / 2;
    
    let txMin, txMax, tyMin, tyMax;
    
    if (dx > 0) {
      txMin = (bLeft - aRight) / dx;
      txMax = (bRight - aLeft) / dx;
    } else if (dx < 0) {
      txMin = (bRight - aLeft) / dx;
      txMax = (bLeft - aRight) / dx;
    } else {
      txMin = -Infinity;
      txMax = Infinity;
    }
    
    if (dy > 0) {
      tyMin = (bTop - aBottom) / dy;
      tyMax = (bBottom - aTop) / dy;
    } else if (dy < 0) {
      tyMin = (bBottom - aTop) / dy;
      tyMax = (bTop - aBottom) / dy;
    } else {
      tyMin = -Infinity;
      tyMax = Infinity;
    }
    
    const tMin = Math.max(txMin, tyMin);
    const tMax = Math.min(txMax, tyMax);
    
    if (tMin <= tMax && tMin >= 0 && tMin <= 1) {
      return {
        time: tMin,
        normal: this.getCollisionNormal(objA, objB)
      };
    }
    
    return null;
  }
}