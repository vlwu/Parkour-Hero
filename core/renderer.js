import { PLAYER_CONSTANTS } from '../entities/player.js';

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

  renderScene(camera, level, player, collectedFruits, particles) {
    camera.apply(this.ctx);

    const backgroundCanvas = this._preRenderBackground(level);
    this.ctx.drawImage(backgroundCanvas, 0, 0);

    this.drawPlatforms(level.platforms, camera);
    if (level.trophy) {
        this.drawTrophy(level.trophy, camera);
    }
    this.drawFruits(level.getActiveFruits(), camera);
    this.drawCheckpoints(level.checkpoints, camera);
    this.drawPlayer(player);
    this.drawParticles(particles, camera);
    this.drawCollectedFruits(collectedFruits, camera);

    camera.restore(this.ctx);
  }

  drawPlayer(player) {
    try {
      const stateName = player.currentState.name;
      if (player.despawnAnimationFinished && stateName !== 'despawn') return;

      const spriteKey = player.getSpriteKey();
      const characterSprites = this.assets.characters[player.characterId];
      let sprite = characterSprites?.[spriteKey] || this.assets[spriteKey];

      if (!sprite) {
        console.warn(`Sprite for ${spriteKey} (char: ${player.characterId}) not loaded.`);
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
  
  drawPlatforms(platforms, camera) {
    for (const platform of platforms) {
        if (!camera.isRectVisible(platform)) {
            continue;
        }

        try {
            const terrainSprite = platform.terrainType === 'sand' || platform.terrainType === 'mud' || platform.terrainType === 'ice'
              ? this.assets.sand_mud_ice
              : this.assets.block;

            const fallbackAndReturn = () => {
                const colors = {
                    dirt: '#8B4513', stone: '#696969', wood: '#D2691E',
                    sand: '#F4A460', mud: '#665A48', ice: '#ADD8E6'
                };
                this.ctx.fillStyle = colors[platform.terrainType] || '#808080';
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            };

            if (!terrainSprite) {
                fallbackAndReturn();
                continue;
            }

            const config = platform.spriteConfig[platform.terrainType];
            const fullTiles = Math.floor(platform.width / platform.tileSize);

            for (let i = 0; i < fullTiles; i++) {
                const tileX = platform.x + i * platform.tileSize;
                this.ctx.drawImage(
                    terrainSprite,
                    config.srcX, config.srcY,
                    platform.tileSize, platform.tileSize,
                    tileX, platform.y,
                    platform.tileSize, platform.tileSize
                );
            }
        } catch (error) {
            console.warn('Error rendering platform:', error);
            // Fallback rendering
            this.ctx.fillStyle = '#808080';
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
    }
  }
  
  drawTrophy(trophy, camera) {
    if (!camera.isVisible(trophy.x - trophy.size / 2, trophy.y - trophy.size / 2, trophy.size, trophy.size)) {
        return;
    }
  
    const sprite = this.assets['trophy'];

    if (!sprite) {
      this.ctx.fillStyle = trophy.acquired ? 'silver' : 'gold';
      if (trophy.inactive) {
        this.ctx.fillStyle = 'gray'; 
      }
      this.ctx.beginPath();
      this.ctx.arc(trophy.x, trophy.y, trophy.size / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = 'black';
      this.ctx.font = '16px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('🏆', trophy.x, trophy.y + 5);
      return;
    }

    const frameWidth = sprite.width / trophy.frameCount;
    const frameHeight = sprite.height;
    const srcX = frameWidth * trophy.animationFrame;

    if (trophy.inactive) {
      this.ctx.globalAlpha = 0.5;
    }

    this.ctx.drawImage(
      sprite, srcX, 0, frameWidth, frameHeight,
      trophy.x - trophy.size / 2, trophy.y - trophy.size / 2,
      trophy.size, trophy.size
    );
    this.ctx.globalAlpha = 1.0;
  }

  drawFruits(fruits, camera) {
    for (let i = 0, len = fruits.length; i < len; i++) {
      const fruit = fruits[i];

      if (!camera.isVisible(fruit.x - fruit.size / 2, fruit.y - fruit.size / 2, fruit.size, fruit.size)) {
        continue;
      }

      try {
        const img = this.assets[fruit.spriteKey];
        if (!img) {
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