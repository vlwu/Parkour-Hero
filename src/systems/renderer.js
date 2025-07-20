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
    this.backgroundCache = new Map(); // Cache for pre-rendered background canvases
    this.backgroundOffset = { x: 0, y: 0 };
  }

  // --- EFFICIENT BACKGROUND RENDERING ---
  _preRenderBackground(level) {
    const bgAssetKey = level.background;
    
    // If we have already pre-rendered this background, return the cached canvas
    if (this.backgroundCache.has(bgAssetKey)) {
        return this.backgroundCache.get(bgAssetKey);
    }
    
    const bg = this.assets[bgAssetKey];
    if (!bg || !bg.complete || bg.naturalWidth === 0) {
        return null; // Asset not ready or invalid
    }

    // Create an offscreen canvas that is larger than the screen to allow for scrolling
    // without seeing the edges. Tiling it once in each direction is sufficient.
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = this.canvas.width + bg.width;
    offscreenCanvas.height = this.canvas.height + bg.height;

    // Create the pattern ONCE and fill the offscreen canvas with it
    const pattern = offscreenCtx.createPattern(bg, 'repeat');
    offscreenCtx.fillStyle = pattern;
    offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    
    // Store the pre-rendered canvas in the cache
    this.backgroundCache.set(bgAssetKey, offscreenCanvas);
    console.log(`Successfully pre-rendered and cached background: ${bgAssetKey}`);
    return offscreenCanvas;
  }
  
  drawScrollingBackground(level, dt) {
    // Get the pre-rendered background from the cache.
    const bgCanvas = this._preRenderBackground(level);

    // Also get the original background asset to know its dimensions for tiling calculations.
    const bg = this.assets[level.background];

    if (!bgCanvas || !bg || !bg.complete || bg.naturalWidth === 0) {
      // Draw a solid color if the background isn't available or ready.
      this.ctx.fillStyle = '#87CEEB';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    // Update the scroll offset based on time.
    const scroll = level.backgroundScroll;
    this.backgroundOffset.x += scroll.x * dt;
    this.backgroundOffset.y += scroll.y * dt;

    // Use the original background's dimensions for the modulo operation to ensure scrolling loops correctly.
    const bgWidth = bg.width;
    const bgHeight = bg.height;
    
    // Calculate the source 'x' and 'y' coordinates for slicing from the pre-rendered canvas.
    // The `(a % n + n) % n` pattern ensures the result is always a positive remainder, providing
    // a consistent, looping coordinate within the dimensions of the background tile.
    const sx = (this.backgroundOffset.x % bgWidth + bgWidth) % bgWidth;
    const sy = (this.backgroundOffset.y % bgHeight + bgHeight) % bgHeight;

    // The `bgCanvas` is intentionally created larger than the screen (`canvas.width + bg.width`).
    // This allows us to select a `canvas.width` x `canvas.height` slice starting from our
    // calculated `(sx, sy)`. This single slice contains the correctly tiled and wrapped background view.
    // Drawing it once to the main canvas at (0,0) is efficient and fixes the previous overlap bug.
    this.ctx.drawImage(bgCanvas, sx, sy, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height);
  }

  renderScene(camera, level, player, collectedFruits, particles) {
    camera.apply(this.ctx);

    this.drawTileGrid(level, camera);

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
  
  drawTileGrid(level, camera) {
    const tileSize = GRID_CONSTANTS.TILE_SIZE;
    
    const startCol = Math.floor(camera.x / tileSize);
    const endCol = Math.ceil((camera.x + camera.width) / tileSize);
    const startRow = Math.floor(camera.y / tileSize);
    const endRow = Math.ceil((camera.y + camera.height) / tileSize);

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        if (x < 0 || x >= level.gridWidth || y < 0 || y >= level.gridHeight) {
          continue;
        }

        const tile = level.tiles[y][x];
        if (tile.type === 'empty') {
          continue;
        }

        const sprite = this.assets[tile.spriteKey];
        if (!sprite) {
          this.ctx.fillStyle = 'magenta';
          this.ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          continue;
        }

        const screenX = x * tileSize;
        const screenY = y * tileSize;

        if (tile.spriteConfig) {
            this.ctx.drawImage(
              sprite,
              tile.spriteConfig.srcX, tile.spriteConfig.srcY,
              tileSize, tileSize,
              screenX, screenY,
              tileSize, tileSize
            );
        } else {
            this.ctx.drawImage(sprite, screenX, screenY, tileSize, tileSize);
        }
      }
    }
  }

  drawPlayer(player) {
    try {
      const stateName = player.currentState.name;
      if (player.despawnAnimationFinished && stateName !== 'despawn') return;

      const spriteKey = player.getSpriteKey();
      const characterSprites = this.assets.characters[player.characterId];
      let sprite = characterSprites?.[spriteKey] || this.assets[spriteKey];

      if (!sprite) {
        this.ctx.fillStyle = '#FF00FF';
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
    if (!sprite) { return; }

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
      if (!img) { continue; }
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
        } else {
            sprite = this.assets.trampoline_idle;
            if (sprite) {
                frameWidth = sprite.width;
            }
        }

        if (sprite && frameWidth > 0) {
            this.ctx.drawImage(
                sprite,
                srcX, 0,
                frameWidth, sprite.height,
                tramp.x - tramp.size / 2,
                tramp.y - tramp.size / 2,
                tramp.size, tramp.size
            );
        } else {
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

  drawUI(ctx, buttons, hoveredButton, isRunning) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    for (const button of buttons) {
        if (!button.visible) continue;

        let assetKey;
        if (button.id === 'pause') {
            assetKey = isRunning ? 'pause_icon' : 'play_icon';
        } else {
            assetKey = button.assetKey;
        }

        const sprite = this.assets[assetKey];
        if (!sprite) continue;

        let x = button.x;
        let y = button.y;
        let width = button.width;
        let height = button.height;

        const isHovered = hoveredButton && hoveredButton.id === button.id;
        
        if (isHovered) {
            const scale = 1.1;
            width *= scale;
            height *= scale;
            x -= (width - button.width) / 2;
            y -= (height - button.height) / 2;
        }
        
        ctx.globalAlpha = isHovered ? 1.0 : 0.8;

        ctx.drawImage(sprite, x, y, width, height);
    }
    ctx.restore();
  }
}