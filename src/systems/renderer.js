import { PLAYER_CONSTANTS, GRID_CONSTANTS } from '../utils/constants.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { PreviousPositionComponent } from '../components/PreviousPositionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CharacterComponent } from '../components/CharacterComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { WebGLSpriteBatcher } from '../core/WebGLSpriteBatcher.js';

export class Renderer {
  constructor(ctx, gl, canvas, assets) {
    this.ctx = ctx;
    this.gl = gl;
    this.canvas = canvas;
    this.assets = assets;
    this.backgroundCache = new Map();
    this.backgroundOffset = { x: 0, y: 0 };
    this.staticLayerCache = null;
    this.previewMode = false;
    this.spriteBatcher = new WebGLSpriteBatcher(gl);
    this.webGLTextures = new Map(); // Cache for WebGLTexture objects
  }

  _getWebGLTexture(image) {
    if (!image) return null;
    if (this.webGLTextures.has(image)) {
        return this.webGLTextures.get(image);
    }

    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.webGLTextures.set(image, texture);
    return texture;
  }

  preRenderLevel(level) {
    this.staticLayerCache = document.createElement('canvas');
    this.staticLayerCache.width = level.width;
    this.staticLayerCache.height = level.height;
    const cacheCtx = this.staticLayerCache.getContext('2d');
    cacheCtx.imageSmoothingEnabled = false;

    const tileSize = GRID_CONSTANTS.TILE_SIZE;

    for (let y = 0; y < level.gridHeight; y++) {
      for (let x = 0; x < level.gridWidth; x++) {
        const tile = level.tiles[y][x];

        if (tile.solid) {
            const sprite = this.assets[tile.spriteKey];
            if (!sprite) {
                cacheCtx.fillStyle = 'magenta';
                cacheCtx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                continue;
            }
            const screenX = x * tileSize;
            const screenY = y * tileSize;

            if (tile.spriteConfig) {
                const sWidth = tile.spriteConfig.width || tileSize;
                const sHeight = tile.spriteConfig.height || tileSize;
                const dWidth = tile.collisionBox ? tile.collisionBox.width : tileSize;
                const dHeight = tile.collisionBox ? tile.collisionBox.height : tileSize;
                const finalDHeight = tile.oneWay && !tile.collisionBox ? sHeight : dHeight;
                cacheCtx.drawImage(
                    sprite,
                    tile.spriteConfig.srcX, tile.spriteConfig.srcY,
                    sWidth, sHeight,
                    screenX, screenY,
                    dWidth, finalDHeight
                );
            }
        }
      }
    }
  }

  _preRenderBackground(level) {
    const bgAssetKey = level.background;
    if (this.backgroundCache.has(bgAssetKey)) {
        return this.backgroundCache.get(bgAssetKey);
    }

    const bg = this.assets[bgAssetKey];
    if (!bg || !bg.complete || bg.naturalWidth === 0) {
        return null;
    }

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = this.canvas.width + bg.width;
    offscreenCanvas.height = this.canvas.height + bg.height;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    const pattern = offscreenCtx.createPattern(bg, 'repeat');
    offscreenCtx.fillStyle = pattern;
    offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    this.backgroundCache.set(bgAssetKey, offscreenCanvas);
    return offscreenCanvas;
  }

  drawScrollingBackground(level, dt) {
    const bgCanvas = this._preRenderBackground(level);
    const bg = this.assets[level.background];

    if (!bgCanvas || !bg || !bg.complete || bg.naturalWidth === 0) {
      this.ctx.fillStyle = '#87CEEB';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    this.backgroundOffset.x += level.backgroundScroll.x * dt;
    this.backgroundOffset.y += level.backgroundScroll.y * dt;

    const sx = (this.backgroundOffset.x % bg.width + bg.width) % bg.width;
    const sy = (this.backgroundOffset.y % bg.height + bg.height) % bg.height;

    this.ctx.drawImage(bgCanvas, sx, sy, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height);
  }

  renderStaticLayer(camera, alpha) {
      camera.apply(this.ctx, alpha);
      if (this.staticLayerCache) {
          this.ctx.drawImage(this.staticLayerCache, 0, 0);
      }
      camera.restore(this.ctx);
  }

  renderSceneWebGL(camera, level, entityManager, effectsSystem, alpha) {
    this.spriteBatcher.begin(camera);

    const visibleObjects = level.spatialGrid.query(camera.getViewportBounds());

    for (const obj of visibleObjects) {
        if (!obj.instance) continue;
        const instance = obj.instance;
        switch(obj.type) {
            case 'trap': this._queueTrap(instance); break;
            case 'fruit': if (!instance.collected) this._queueFruit(instance); break;
            case 'checkpoint': this._queueCheckpoint(instance); break;
            case 'trophy': this._queueTrophy(instance); break;
        }
    }

    const entities = entityManager.query([PositionComponent, RenderableComponent]);
    for(const entityId of entities) {
        const pos = entityManager.getComponent(entityId, PositionComponent);
        const prevPos = entityManager.getComponent(entityId, PreviousPositionComponent);
        const renderable = entityManager.getComponent(entityId, RenderableComponent);
        let renderX = pos.x;
        let renderY = pos.y;
        if (prevPos) {
            renderX = prevPos.x + (pos.x - prevPos.x) * alpha;
            renderY = prevPos.y + (pos.y - prevPos.y) * alpha;
        }
        const interpolatedPos = { x: renderX, y: renderY };
        if (entityManager.hasComponent(entityId, PlayerControlledComponent)) {
            const charComp = entityManager.getComponent(entityId, CharacterComponent);
            const playerCtrl = entityManager.getComponent(entityId, PlayerControlledComponent);
            this._queuePlayer(interpolatedPos, renderable, charComp, playerCtrl);
        } else if (entityManager.hasComponent(entityId, EnemyComponent)) {
            this._queueEnemy(interpolatedPos, renderable);
        }
    }

    this._queueEffects(effectsSystem.getActiveEffects());

    this.spriteBatcher.end();
  }
  
  _queueTrap(trap) {
      switch (trap.type) {
          case 'arrow_bubble': this._queueArrowBubble(trap); break;
          case 'falling_platform': this._queueFallingPlatform(trap); break;
          case 'fan': this._queueFan(trap); break;
          case 'fire_trap': this._queueFireTrap(trap); break;
          case 'rock_head': this._queueRockHead(trap); break;
          case 'saw': this._queueSaw(trap); break;
          case 'spike_head': this._queueSpikeHead(trap); break;
          case 'spiked_ball': this._queueSpikedBall(trap); break;
          case 'spikes': this._queueSpikes(trap); break;
          case 'trampoline': this._queueTrampoline(trap); break;
      }
  }

  _queueArrowBubble(trap) {
      if (trap.state === 'respawning') return;
      const spriteAsset = trap.state === 'idle' ? this.assets.arrow_idle : this.assets.arrow_hit;
      if (!spriteAsset) return;
      const webGLTexture = this._getWebGLTexture(spriteAsset);
      if (!webGLTexture) return;
      const frame = trap.state === 'idle' ? trap.idleAnimation.currentFrame : trap.hitAnimation.currentFrame;
      const frameCount = trap.state === 'idle' ? trap.idleAnimation.frameCount : trap.hitAnimation.frameCount;
      const frameWidth = spriteAsset.width / frameCount;
      this.spriteBatcher.draw(webGLTexture, spriteAsset.width, spriteAsset.height, trap.x - trap.width / 2, trap.y - trap.height / 2, trap.width, trap.height, frame * frameWidth, 0, frameWidth, spriteAsset.height);
  }

  _queueFallingPlatform(trap) {
      if (trap.state === 'respawning' || trap.opacity < 1) return;
      const drawX = (trap.x - trap.width / 2) + trap.shakeOffsetX;
      const drawY = (trap.y - trap.height / 2) + trap.shakeOffsetY;
      const isPlatformActive = trap.state === 'idle' || trap.state === 'active';
      const spriteAsset = isPlatformActive ? this.assets.falling_platform_on : this.assets.falling_platform_off;
      if (!spriteAsset) return;
      const webGLTexture = this._getWebGLTexture(spriteAsset);
      if (!webGLTexture) return;
      if (isPlatformActive) {
          const frameWidth = spriteAsset.width / trap.animation.frameCount;
          const srcX = trap.animation.currentFrame * frameWidth;
          this.spriteBatcher.draw(webGLTexture, spriteAsset.width, spriteAsset.height, drawX, drawY, trap.width, trap.height, srcX, 0, frameWidth, spriteAsset.height);
      } else {
          this.spriteBatcher.draw(webGLTexture, spriteAsset.width, spriteAsset.height, drawX, drawY, trap.width, trap.height, 0, 0, spriteAsset.width, spriteAsset.height);
      }
  }

  _queueFan(trap) {
      const spriteAsset = trap.state === 'on' ? this.assets.fan_on : this.assets.fan_off;
      if (!spriteAsset) return;
      const webGLTexture = this._getWebGLTexture(spriteAsset);
      if (!webGLTexture) return;
      const frame = trap.state === 'on' ? trap.onAnimation.currentFrame : 0;
      const frameCount = trap.state === 'on' ? trap.onAnimation.frameCount : 1;
      const frameWidth = spriteAsset.width / frameCount;
      this.spriteBatcher.draw(webGLTexture, spriteAsset.width, spriteAsset.height, trap.x - trap.width / 2, trap.y - trap.height / 2, trap.width, trap.height, frame * frameWidth, 0, frameWidth, spriteAsset.height);
  }

  _queueFireTrap(trap) {
      const baseWidth = 16;
      const startX = trap.x - trap.width / 2;
      const drawY = trap.y - trap.height / 2;
      const baseSpriteAsset = this.assets.fire_off;
      if (baseSpriteAsset) {
          const webGLTexture = this._getWebGLTexture(baseSpriteAsset);
          if (webGLTexture) {
              for (let i = 0; i < trap.chainLength; i++) {
                  this.spriteBatcher.draw(webGLTexture, baseSpriteAsset.width, baseSpriteAsset.height, startX + i * baseWidth, drawY, baseWidth, trap.height, 0, 16, 16, 16);
              }
          }
      }
      if (trap.state === 'off') return;
      let spriteAsset, srcX = 0, frameWidth;
      if (trap.state === 'activating') {
          spriteAsset = this.assets.fire_hit;
          frameWidth = spriteAsset.width / trap.anim.activating.frames;
          srcX = trap.frame * frameWidth;
      } else {
          spriteAsset = this.assets.fire_on;
          frameWidth = spriteAsset.width / trap.anim.on.frames;
          srcX = trap.frame * frameWidth;
      }
      if (spriteAsset) {
          const webGLTexture = this._getWebGLTexture(spriteAsset);
          if(webGLTexture) {
              for (let i = 0; i < trap.chainLength; i++) {
                  this.spriteBatcher.draw(webGLTexture, spriteAsset.width, spriteAsset.height, startX + i * baseWidth, trap.y - trap.height * 1.5, baseWidth, trap.height * 2, srcX, 0, frameWidth, spriteAsset.height);
              }
          }
      }
  }

  _queueRockHead(trap) {
    this._queueSharedHeadTrap(trap, 'rh');
  }

  _queueSpikeHead(trap) {
    this._queueSharedHeadTrap(trap, 'sh');
  }

  _queueSharedHeadTrap(trap, assetPrefix) {
      const drawX = trap.x - trap.width / 2 + trap.shakeOffset.x;
      const drawY = trap.y - trap.height / 2 + trap.shakeOffset.y;
      let spriteAsset = this.assets[`${assetPrefix}_idle`];
      let sX = 0;
      let frameWidth = spriteAsset ? spriteAsset.width : 0;
      if (trap.state === 'blinking') {
          spriteAsset = this.assets[`${assetPrefix}_blink`];
          frameWidth = spriteAsset.width / trap.animations.blink.frameCount;
          sX = trap.animations.blink.frame * frameWidth;
      } else if (trap.state === 'slammed') {
          spriteAsset = this.assets[`${assetPrefix}_bottom_hit`];
          frameWidth = spriteAsset.width / trap.animations.hit.frameCount;
          sX = trap.animations.hit.frame * frameWidth;
      }
      if (spriteAsset) {
          const webGLTexture = this._getWebGLTexture(spriteAsset);
          if (webGLTexture) {
              this.spriteBatcher.draw(webGLTexture, spriteAsset.width, spriteAsset.height, drawX, drawY, trap.width, trap.height, sX, 0, frameWidth, spriteAsset.height);
          }
      }
  }

  _queueSaw(trap) {
      const sawSpriteAsset = this.assets.saw;
      if (sawSpriteAsset) {
          const webGLTexture = this._getWebGLTexture(sawSpriteAsset);
          if (webGLTexture) {
              const frameWidth = sawSpriteAsset.width / trap.animation.frameCount;
              const srcX = trap.animation.currentFrame * frameWidth;
              this.spriteBatcher.draw(webGLTexture, sawSpriteAsset.width, sawSpriteAsset.height, trap.sawX - trap.width / 2, trap.sawY - trap.height / 2, trap.width, trap.height, srcX, 0, frameWidth, sawSpriteAsset.height);
          }
      }
  }

  _queueSpikedBall(trap) {
      const ballSpriteAsset = this.assets.spiked_ball;
      if (ballSpriteAsset) {
          const webGLTexture = this._getWebGLTexture(ballSpriteAsset);
          if (webGLTexture) {
              this.spriteBatcher.draw(webGLTexture, ballSpriteAsset.width, ballSpriteAsset.height, trap.ballX - trap.width / 2, trap.ballY - trap.height / 2, trap.width, trap.height, 0, 0, ballSpriteAsset.width, ballSpriteAsset.height);
          }
      }
  }

  _queueSpikes(trap) {
      if (trap.state !== 'extended') return;
      const spriteAsset = this.assets.spike_two;
      if (spriteAsset) {
          const webGLTexture = this._getWebGLTexture(spriteAsset);
          if (webGLTexture) {
              this.spriteBatcher.draw(webGLTexture, spriteAsset.width, spriteAsset.height, trap.x - trap.width / 2, trap.y - trap.height / 2, trap.width, trap.height, 0, 0, spriteAsset.width, spriteAsset.height);
          }
      }
  }

  _queueTrampoline(trap) {
      const drawX = trap.x - trap.width / 2;
      const drawY = trap.y - trap.height / 2;
      let spriteAsset, srcX = 0, frameWidth;
      if (trap.state === 'jumping') {
          spriteAsset = this.assets.trampoline_jump;
          if (spriteAsset) {
              frameWidth = spriteAsset.width / trap.frameCount;
              srcX = trap.frame * frameWidth;
          }
      } else {
          spriteAsset = this.assets.trampoline_idle;
          if (spriteAsset) frameWidth = spriteAsset.width;
      }
      if (spriteAsset && frameWidth > 0) {
          const webGLTexture = this._getWebGLTexture(spriteAsset);
          if (webGLTexture) {
              this.spriteBatcher.draw(webGLTexture, spriteAsset.width, spriteAsset.height, drawX, drawY, trap.width, trap.height, srcX, 0, frameWidth, spriteAsset.height);
          }
      }
  }

  _queuePlayer(pos, renderable, charComp, playerCtrl) {
    const stateName = renderable.animationState;
    if (!renderable.isVisible || (playerCtrl && playerCtrl.despawnAnimationFinished)) return;
    const stateToSpriteMap = {
      idle: 'playerIdle', run: 'playerRun', jump: 'playerJump',
      double_jump: 'playerDoubleJump', fall: 'playerFall',
      dash: 'playerDash', cling: 'playerCling', spawn: 'playerAppear',
      despawn: 'playerDisappear', hit: 'playerHit',
    };
    const spriteAssetKey = stateToSpriteMap[stateName];
    let spriteAsset = (stateName === 'spawn' || stateName === 'despawn')
        ? this.assets[spriteAssetKey]
        : this.assets.characters[charComp.characterId]?.[spriteAssetKey];
    if (!spriteAsset) return;
    const webGLTexture = this._getWebGLTexture(spriteAsset);
    if (!webGLTexture) return;
    const frameCount = PLAYER_CONSTANTS.ANIMATION_FRAMES[stateName] || 1;
    const frameWidth = spriteAsset.width / frameCount;
    const srcX = frameWidth * renderable.animationFrame;
    const flipX = renderable.direction === 'left';
    const isSpecialAnim = stateName === 'spawn' || stateName === 'despawn';
    const renderX = isSpecialAnim ? pos.x - (renderable.width - PLAYER_CONSTANTS.WIDTH) / 2 : pos.x;
    const renderY = isSpecialAnim ? pos.y - (renderable.height - PLAYER_CONSTANTS.HEIGHT) / 2 : pos.y;
    const drawOffsetX = (stateName === 'cling') ? (flipX ? -PLAYER_CONSTANTS.CLING_OFFSET : PLAYER_CONSTANTS.CLING_OFFSET) : 0;
    this.spriteBatcher.draw(webGLTexture, spriteAsset.width, spriteAsset.height, renderX + drawOffsetX, renderY, renderable.width, renderable.height, srcX, 0, frameWidth, spriteAsset.height, flipX);
  }

  _queueEnemy(pos, renderable) {
    if (!renderable.isVisible) return;
    const assetKey = `${renderable.spriteKey}_${renderable.animationState}`;
    const spriteAsset = this.assets[assetKey];
    const enemyDef = ENEMY_DEFINITIONS[renderable.spriteKey];
    if (!spriteAsset || !enemyDef) return;
    const webGLTexture = this._getWebGLTexture(spriteAsset);
    if (!webGLTexture) return;
    const frameCount = enemyDef.animations[renderable.animationState]?.frameCount || 1;
    const frameWidth = spriteAsset.width / frameCount;
    const srcX = (renderable.animationFrame % frameCount) * frameWidth;
    const flipX = (renderable.direction === 'right');
    this.spriteBatcher.draw(webGLTexture, spriteAsset.width, spriteAsset.height, pos.x, pos.y, renderable.width, renderable.height, srcX, 0, frameWidth, spriteAsset.height, flipX);
  }

  _queueTrophy(trophy) {
    const isAnimating = trophy.isAnimating || trophy.acquired;
    const spriteAsset = this.assets[isAnimating ? 'trophy_pressed' : 'trophy_idle'];
    if (!spriteAsset) return;
    const webGLTexture = this._getWebGLTexture(spriteAsset);
    if (!webGLTexture) return;
    const frameWidth = spriteAsset.width / (isAnimating ? trophy.frameCount : 1);
    const srcX = frameWidth * (isAnimating ? trophy.animationFrame : 0);
    this.spriteBatcher.draw(webGLTexture, spriteAsset.width, spriteAsset.height, trophy.x - trophy.size / 2, trophy.y - trophy.size / 2, trophy.size, trophy.size, srcX, 0, frameWidth, spriteAsset.height);
  }

  _queueFruit(fruit) {
      const spriteAsset = this.assets[fruit.spriteKey];
      if (!spriteAsset) return;
      const webGLTexture = this._getWebGLTexture(spriteAsset);
      if (!webGLTexture) return;
      const frameWidth = spriteAsset.width / fruit.frameCount;
      const srcX = frameWidth * fruit.frame;
      this.spriteBatcher.draw(webGLTexture, spriteAsset.width, spriteAsset.height, fruit.x - fruit.size / 2, fruit.y - fruit.size / 2, fruit.size, fruit.size, srcX, 0, frameWidth, spriteAsset.height);
  }

  _queueCheckpoint(cp) {
      let spriteAsset, srcX = 0, frameWidth;
      switch(cp.state) {
        case 'inactive': spriteAsset = this.assets.checkpoint_inactive; if (spriteAsset) frameWidth = spriteAsset.width; break;
        case 'activating': spriteAsset = this.assets.checkpoint_activation; if (spriteAsset) { frameWidth = spriteAsset.width / cp.frameCount; srcX = cp.frame * frameWidth; } break;
        case 'active': spriteAsset = this.assets.checkpoint_active; if (spriteAsset) { const activeFrameCount = 10; const currentFrame = Math.floor((performance.now() / 1000 / 0.1) % activeFrameCount); frameWidth = spriteAsset.width / activeFrameCount; srcX = currentFrame * frameWidth; } break;
      }
      if (spriteAsset && frameWidth > 0) {
          const webGLTexture = this._getWebGLTexture(spriteAsset);
          if (webGLTexture) {
              this.spriteBatcher.draw(webGLTexture, spriteAsset.width, spriteAsset.height, cp.x - cp.size / 2, cp.y - cp.size / 2, cp.size, cp.size, srcX, 0, frameWidth, spriteAsset.height);
          }
      }
  }

  _queueEffects(effects) {
      if (effects.length === 0) return;
      const spriteAsset = this.assets['fruit_collected'];
      if (!spriteAsset) return;
      const webGLTexture = this._getWebGLTexture(spriteAsset);
      if (!webGLTexture) return;
      const frameWidth = spriteAsset.width / 6;
      for (const effect of effects) {
          const srcX = effect.frame * frameWidth;
          this.spriteBatcher.draw(webGLTexture, spriteAsset.width, spriteAsset.height, effect.x - effect.size / 2, effect.y - effect.size / 2, effect.size, effect.size, srcX, 0, frameWidth, spriteAsset.height);
      }
  }
}