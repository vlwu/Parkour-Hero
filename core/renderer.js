// the renderer file is responsible for rendering the game world, including the player and other entities.
export class Renderer {
  constructor(ctx, canvas, assets) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
  }

  renderScene(camera, level, player, collectedFruits, particles) {
    camera.apply(this.ctx);

    this.drawBackground(camera, level.background);
    level.render(this.ctx, this.assets, camera);
    this.drawFruits(level.getActiveFruits(), camera);
    this.drawCheckpoints(level.checkpoints, camera);
    player.render(this.ctx);
    this.drawParticles(particles, camera);
    this.drawCollectedFruits(collectedFruits, camera);

    camera.restore(this.ctx);
  }

  drawBackground(camera, backgroundKey) {
    const bg = this.assets[backgroundKey];

    if (!bg || !bg.complete || bg.naturalWidth === 0) {
      // Fallback solid color gradient if the asset is missing or not loaded
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#98FB98');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(camera.x, camera.y, this.canvas.width, this.canvas.height);
      return;
    }

    const tileSize = 64;
    const spriteSize = 64;
    const srcX = 0, srcY = 0;

    // Calculate which tiles are visible in the camera's viewport
    const startX = Math.floor(camera.x / tileSize);
    const startY = Math.floor(camera.y / tileSize);
    const endX = Math.ceil((camera.x + this.canvas.width) / tileSize);
    const endY = Math.ceil((camera.y + this.canvas.height) / tileSize);

    for (let i = startX; i <= endX; i++) {
      const x = i * tileSize;
      for (let j = startY; j <= endY; j++) {
        const y = j * tileSize;
        try {
          this.ctx.drawImage(
            bg,
            srcX, srcY,
            spriteSize, spriteSize,
            x, y,
            tileSize, tileSize
          );
        } catch (error) {
          // This catch is for rare cases where a loaded image is corrupt.
          console.warn('Failed to draw background tile, using fallback color.', error);
          this.ctx.fillStyle = '#87CEEB';
          this.ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    }
  }

  // The 'fruits' array is now pre-filtered to only contain active fruits.
  drawFruits(fruits, camera) {
    for (let i = 0, len = fruits.length; i < len; i++) {
      const fruit = fruits[i];

      // Culling: Don't draw objects that are off-screen
      if (!camera.isVisible(fruit.x - fruit.size / 2, fruit.y - fruit.size / 2, fruit.size, fruit.size)) {
        continue;
      }

      try {
        const img = this.assets[fruit.spriteKey];
        if (!img) {
          // Fallback rendering for missing fruit sprite
          this.ctx.fillStyle = '#FF6B6B';
          this.ctx.beginPath();
          this.ctx.arc(fruit.x, fruit.y, fruit.size / 2, 0, Math.PI * 2);
          this.ctx.fill();
          continue;
        }

        const frameWidth = img.width / fruit.frameCount;
        const srcX = frameWidth * fruit.frame;

        this.ctx.drawImage(
          img,
          srcX, 0, frameWidth, img.height,
          fruit.x - fruit.size / 2, fruit.y - fruit.size / 2,
          fruit.size, fruit.size
        );
      } catch (error) {
        this.ctx.fillStyle = '#FF6B6B'; // Error fallback
        this.ctx.beginPath();
        this.ctx.arc(fruit.x, fruit.y, fruit.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  drawParticles(particles, camera) {
    const sprite = this.assets.dust_particle;
    if (!sprite || particles.length === 0) return;

    this.ctx.save();
    for (let i = 0, len = particles.length; i < len; i++) {
        const p = particles[i];

        if (!camera.isVisible(p.x, p.y, p.size, p.size)) {
            continue;
        }

        this.ctx.globalAlpha = p.alpha;
        this.ctx.drawImage(
            sprite,
            p.x - p.size / 2,
            p.y - p.size / 2,
            p.size,
            p.size
        );
    }
    this.ctx.restore();
  }

  drawCollectedFruits(collectedArr, camera) {
    const sprite = this.assets['fruit_collected'];
    if (!sprite) return;

    const frameWidth = sprite.width / 6;
    const frameHeight = sprite.height;

    for (let i = 0, len = collectedArr.length; i < len; i++) {
      const collected = collectedArr[i];

      if (!camera.isVisible(collected.x - collected.size / 2, collected.y - collected.size / 2, collected.size, collected.size)) {
        continue;
      }

      const srcX = collected.frame * frameWidth;
      this.ctx.drawImage(
        sprite,
        srcX, 0,
        frameWidth, frameHeight,
        collected.x - collected.size / 2, collected.y - collected.size / 2,
        collected.size, collected.size
      );
    }
  }

  drawCheckpoints(checkpoints, camera) {
    for (const cp of checkpoints) {
      if (!camera.isVisible(cp.x - cp.size / 2, cp.y - cp.size / 2, cp.size, cp.size)) {
        continue;
      }
      
      let sprite;
      let srcX = 0;
      let frameWidth;

      switch(cp.state) {
        case 'inactive':
          sprite = this.assets.checkpoint_inactive;
          if (sprite) {
            frameWidth = sprite.width;
          }
          break;
        case 'activating':
          sprite = this.assets.checkpoint_activation;
          if (sprite) {
            frameWidth = sprite.width / cp.frameCount;
            srcX = cp.frame * frameWidth;
          }
          break;
        case 'active':
          sprite = this.assets.checkpoint_active;
          if (sprite) {
            const activeFrameCount = 10; // Idle animation for the active flag
            const activeFrameSpeed = 0.1;
            const currentFrame = Math.floor((performance.now() / 1000 / activeFrameSpeed) % activeFrameCount);
            frameWidth = sprite.width / activeFrameCount;
            srcX = currentFrame * frameWidth;
          }
          break;
      }

      if (sprite && frameWidth > 0) {
        this.ctx.drawImage(
          sprite,
          srcX, 0, frameWidth, sprite.height,
          cp.x - cp.size / 2, cp.y - cp.size / 2,
          cp.size, cp.size
        );
      } else {
        // Fallback rendering if sprite is missing
        this.ctx.fillStyle = 'purple';
        this.ctx.fillRect(cp.x - cp.size / 2, cp.y - cp.size / 2, cp.size, cp.size);
      }
    }
  }
}
