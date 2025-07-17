// the renderer file is responsible for rendering the game world, including the player and other entities.
export class Renderer {
  constructor(ctx, canvas, assets) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.backgroundCanvasCache = new Map();
  }

  _preRenderBackground(level) {
    const bgKey = level.background;
    // Return the cached canvas if it already exists.
    if (this.backgroundCanvasCache.has(bgKey)) {
      const cachedData = this.backgroundCanvasCache.get(bgKey);
      if (cachedData.width === level.width && cachedData.height === level.height) {
        return cachedData.canvas;
      }
    }

    const bg = this.assets[bgKey];
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = level.width;
    offscreenCanvas.height = level.height;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    if (!bg || !bg.complete || bg.naturalWidth === 0) {
      // Fallback solid color gradient for the entire level background.
      const gradient = offscreenCtx.createLinearGradient(0, 0, 0, offscreenCanvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#98FB98');
      offscreenCtx.fillStyle = gradient;
      offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    } else {
      const tileSize = 64;
      const spriteSize = 64;
      const srcX = 0, srcY = 0;

      // Loop to tile the background across the entire level dimensions.
      for (let y = 0; y < level.height; y += tileSize) {
        for (let x = 0; x < level.width; x += tileSize) {
          try {
            offscreenCtx.drawImage(
              bg,
              srcX, srcY,
              spriteSize, spriteSize,
              x, y,
              tileSize, tileSize
            );
          } catch (error) {
            console.warn('Failed to draw background tile, using fallback color.', error);
            offscreenCtx.fillStyle = '#87CEEB';
            offscreenCtx.fillRect(x, y, tileSize, tileSize);
          }
        }
      }
    }
    
    // Store the newly created canvas and its dimensions in the cache.
    this.backgroundCanvasCache.set(bgKey, {
        canvas: offscreenCanvas,
        width: level.width,
        height: level.height
    });
    return offscreenCanvas;
  }

  renderScene(camera, level, renderQueue) {
    camera.apply(this.ctx);

    // 1. Draw the pre-rendered level background.
    const backgroundCanvas = this._preRenderBackground(level);
    this.ctx.drawImage(backgroundCanvas, 0, 0);

    // 2. Render static level elements like platforms and the trophy.
    level.render(this.ctx, this.assets, camera);

    // 3. Render all dynamic objects from the unified render queue.
    for (const item of renderQueue) {
      if (!camera.isVisible(item.x, item.y, item.width, item.height)) {
        continue;
      }

      let sprite = null;
      if (item.characterId) {
        sprite = this.assets.characters[item.characterId]?.[item.spriteKey];
      }
      if (!sprite) {
        sprite = this.assets[item.spriteKey];
      }

      this.ctx.save();
      
      if (item.alpha !== undefined) {
        this.ctx.globalAlpha = item.alpha;
      }

      let drawX = item.x;
      if (item.direction === 'left') {
        this.ctx.scale(-1, 1);
        drawX = -(item.x + item.width);
      }

      const frameCount = item.frameCount || 1;
      const frameWidth = sprite.width / frameCount;
      const srcX = frameWidth * (item.frame || 0);

      this.ctx.drawImage(
        sprite,
        srcX, 0, frameWidth, sprite.height,
        drawX + (item.offsetX || 0), item.y + (item.offsetY || 0),
        item.renderWidth || item.width, item.renderHeight || item.height
      );

      this.ctx.restore();
    }

    camera.restore(this.ctx);
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