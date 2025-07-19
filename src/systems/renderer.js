import { PLAYER_CONSTANTS, GRID_CONSTANTS } from '../utils/constants.js';

/**
 * The Renderer is responsible for all drawing operations on the canvas.
 * It now draws the static level geometry by iterating over a tile grid.
 */
export class Renderer {
  constructor(ctx, canvas, assets) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.backgroundCanvasCache = new Map();
  }

  // Pre-rendering the background is a great optimization and remains unchanged.
  _preRenderBackground(level) {
    const bgKey = level.background;
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
      const gradient = offscreenCtx.createLinearGradient(0, 0, 0, offscreenCanvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#98FB98');
      offscreenCtx.fillStyle = gradient;
      offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    } else {
      const pattern = offscreenCtx.createPattern(bg, 'repeat');
      offscreenCtx.fillStyle = pattern;
      offscreenCtx.fillRect(0, 0, level.width, level.height);
    }
    
    this.backgroundCanvasCache.set(bgKey, {
        canvas: offscreenCanvas,
        width: level.width,
        height: level.height
    });
    return offscreenCanvas;
  }

  renderScene(camera, level, player, collectedFruits, particles) {
    camera.apply(this.ctx);

    // 1. Draw the pre-rendered background
    const backgroundCanvas = this._preRenderBackground(level);
    this.ctx.drawImage(backgroundCanvas, 0, 0);

    // 2. Draw the new tile-based level geometry
    this.drawTileGrid(level, camera);

    // 3. Draw all dynamic objects (these methods are mostly unchanged)
    if (level.trophy) {
        this.drawTrophy(level.trophy, camera);
    }
    this.drawFruits(level.getActiveFruits(), camera);
    this.drawCheckpoints(level.checkpoints, camera);
    this.drawTrampolines(level.trampolines, camera);
    this.drawPlayer(player);
    this.drawParticles(particles, camera);
    this.drawCollectedFruits(collectedFruits, camera);

    camera.restore(this.ctx);
  }
  
  /**
   * Draws the static tile grid, culling to only what is visible by the camera.
   * This method replaces the old `drawPlatforms` method.
   * @param {Level} level The level object containing the tile grid.
   * @param {Camera} camera The camera object for culling.
   */
  drawTileGrid(level, camera) {
    const tileSize = GRID_CONSTANTS.TILE_SIZE;
    
    // Calculate the range of tiles visible in the camera's viewport
    const startCol = Math.floor(camera.x / tileSize);
    const endCol = Math.ceil((camera.x + camera.width) / tileSize);
    const startRow = Math.floor(camera.y / tileSize);
    const endRow = Math.ceil((camera.y + camera.height) / tileSize);

    // Loop only over the visible tiles
    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        // Ensure we don't try to draw tiles outside the level's bounds
        if (x < 0 || x >= level.gridWidth || y < 0 || y >= level.gridHeight) {
          continue;
        }

        const tile = level.tiles[y][x];
        if (tile.type === 'empty') {
          continue; // Don't draw empty space
        }

        const sprite = this.assets[tile.spriteKey];
        if (!sprite) {
          // Fallback drawing if an asset is missing
          this.ctx.fillStyle = 'magenta';
          this.ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          continue;
        }

        const screenX = x * tileSize;
        const screenY = y * tileSize;

        // Handle tiles from a shared spritesheet vs. individual sprite images
        if (tile.spriteConfig) {
            this.ctx.drawImage(
              sprite,
              tile.spriteConfig.srcX, tile.spriteConfig.srcY,
              tileSize, tileSize, // Source dimensions from spritesheet
              screenX, screenY,
              tileSize, tileSize  // Destination dimensions on canvas
            );
        } else {
            // Draw the whole image for tiles that have their own asset file
            this.ctx.drawImage(sprite, screenX, screenY, tileSize, tileSize);
        }
      }
    }
  }


  // --- DYNAMIC OBJECT RENDERING (Unchanged) ---
  // The logic for drawing the player, fruits, particles, etc., does not need to change
  // as they are still dynamic, coordinate-based objects.

  drawPlayer(player) {
    try {
      const stateName = player.currentState.name;
      if (player.despawnAnimationFinished && stateName !== 'despawn') return;

      const spriteKey = player.getSpriteKey();
      const characterSprites = this.assets.characters[player.characterId];
      let sprite = characterSprites?.[spriteKey] || this.assets[spriteKey];

      if (!sprite) {
        this.ctx.fillStyle = '#FF00FF'; // Fallback
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
        return;
      }

      const frameCount = PLAYER_CONSTANTS.ANIMATION_FRAMES[stateName] || 1;
      const frameWidth = sprite.width / frameCount;
      const srcX = frameWidth * player.animationFrame;

      this.ctx.save();
      if (player.direction === 'left') {
        this.ctx.scale(-1, 1);
        this.ctx.translate(-player.x - player.width, player.y);
      } else {
        this.ctx.translate(player.x, player.y);
      }
      
      const isSpecialAnim = stateName === 'spawn' || stateName === 'despawn';
      const renderWidth = isSpecialAnim ? player.spawnWidth : player.width;
      const renderHeight = isSpecialAnim ? player.spawnHeight : player.height;
      const renderX = isSpecialAnim ? -(player.spawnWidth - player.width) / 2 : 0;
      const renderY = isSpecialAnim ? -(player.spawnHeight - player.height) / 2 : 0;
      const drawOffsetX = (stateName === 'cling') ? PLAYER_CONSTANTS.CLING_OFFSET : 0;

      this.ctx.drawImage(
        sprite,
        srcX, 0, frameWidth, sprite.height,
        drawOffsetX + renderX, renderY,
        renderWidth, renderHeight
      );

      this.ctx.restore();
    } catch (error) {
      console.error('Error rendering player:', error);
      this.ctx.fillStyle = '#FF00FF';
      this.ctx.fillRect(player.x, player.y, player.width, player.height);
    }
  }

  drawTrophy(trophy, camera) {
    if (!camera.isVisible(trophy.x - trophy.size / 2, trophy.y - trophy.size / 2, trophy.size, trophy.size)) {
        return;
    }
  
    const sprite = this.assets['trophy'];
    if (!sprite) { /* ... fallback drawing ... */ return; }

    const frameWidth = sprite.width / trophy.frameCount;
    const srcX = frameWidth * trophy.animationFrame;

    if (trophy.inactive) this.ctx.globalAlpha = 0.5;
    this.ctx.drawImage(
      sprite, srcX, 0, frameWidth, sprite.height,
      trophy.x - trophy.size / 2, trophy.y - trophy.size / 2,
      trophy.size, trophy.size
    );
    this.ctx.globalAlpha = 1.0;
  }

  drawFruits(fruits, camera) {
    for (const fruit of fruits) {
      if (!camera.isRectVisible({x: fruit.x - fruit.size/2, y: fruit.y - fruit.size/2, width: fruit.size, height: fruit.size})) continue;
      const img = this.assets[fruit.spriteKey];
      if (!img) { /* ... fallback drawing ... */ continue; }
      const frameWidth = img.width / fruit.frameCount;
      const srcX = frameWidth * fruit.frame;
      this.ctx.drawImage(
        img, srcX, 0, frameWidth, img.height,
        fruit.x - fruit.size / 2, fruit.y - fruit.size / 2,
        fruit.size, fruit.size
      );
    }
  }

  drawTrampolines(trampolines, camera) {
    for (const tramp of trampolines) {
        if (!camera.isRectVisible({x: tramp.x, y: tramp.y, width: tramp.size, height: tramp.size})) continue;

        let sprite;
        let srcX = 0;
        let frameWidth;

        if (tramp.state === 'jumping') {
            sprite = this.assets.trampoline_jump;
            if (sprite) {
                frameWidth = sprite.width / tramp.frameCount;
                srcX = tramp.frame * frameWidth;
            }
        } else { // idle
            sprite = this.assets.trampoline_idle;
            if (sprite) {
                frameWidth = sprite.width; // Idle is a single frame
            }
        }

        if (sprite && frameWidth > 0) {
            this.ctx.drawImage(
                sprite,
                srcX, 0,
                frameWidth, sprite.height,
                tramp.x - tramp.size / 2, // Corrected X
                tramp.y - tramp.size / 2, // Corrected Y
                tramp.size, tramp.size
            );
        } else { // Fallback drawing
            this.ctx.fillStyle = '#8e44ad';
            this.ctx.fillRect(tramp.x - tramp.size / 2, tramp.y - tramp.size / 2, tramp.size, tramp.size);
        }
    }
  }

  drawParticles(particles, camera) {
    if (particles.length === 0) return;
    this.ctx.save();
    for (const p of particles) {
        const sprite = this.assets[p.spriteKey] || this.assets.dust_particle;
        if (!sprite || !camera.isVisible(p.x, p.y, p.size, p.size)) continue;
        this.ctx.globalAlpha = p.alpha;
        this.ctx.drawImage(sprite, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    this.ctx.restore();
  }

  drawCollectedFruits(collectedArr, camera) {
    const sprite = this.assets['fruit_collected'];
    if (!sprite) return;
    const frameWidth = sprite.width / 6;
    for (const collected of collectedArr) {
      if (!camera.isRectVisible({x: collected.x, y: collected.y, width: collected.size, height: collected.size})) continue;
      const srcX = collected.frame * frameWidth;
      this.ctx.drawImage(
        sprite, srcX, 0, frameWidth, sprite.height,
        collected.x - collected.size / 2, collected.y - collected.size / 2,
        collected.size, collected.size
      );
    }
  }

  drawCheckpoints(checkpoints, camera) {
    for (const cp of checkpoints) {
      if (!camera.isRectVisible({x: cp.x, y: cp.y, width: cp.size, height: cp.size})) continue;
      let sprite, srcX = 0, frameWidth;
      switch(cp.state) {
        case 'inactive': sprite = this.assets.checkpoint_inactive; if (sprite) frameWidth = sprite.width; break;
        case 'activating': sprite = this.assets.checkpoint_activation; if (sprite) { frameWidth = sprite.width / cp.frameCount; srcX = cp.frame * frameWidth; } break;
        case 'active': sprite = this.assets.checkpoint_active; if (sprite) { const activeFrameCount = 10; const activeFrameSpeed = 0.1; const currentFrame = Math.floor((performance.now() / 1000 / activeFrameSpeed) % activeFrameCount); frameWidth = sprite.width / activeFrameCount; srcX = currentFrame * frameWidth; } break;
      }
      if (sprite && frameWidth > 0) { this.ctx.drawImage(sprite, srcX, 0, frameWidth, sprite.height, cp.x - cp.size / 2, cp.y - cp.size / 2, cp.size, cp.size); } 
      else { this.ctx.fillStyle = 'purple'; this.ctx.fillRect(cp.x - cp.size / 2, cp.y - cp.size / 2, cp.size, cp.size); }
    }
  }
}