import { PLAYER_CONSTANTS, GRID_CONSTANTS } from '../utils/constants.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CharacterComponent } from '../components/CharacterComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';

export class Renderer {
  constructor(ctx, canvas, assets) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.backgroundCache = new Map();
    this.backgroundOffset = { x: 0, y: 0 };
    this.staticLayerCache = null;
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

        if (tile.solid && !tile.oneWay) {
            const sprite = this.assets[tile.spriteKey];
            if (!sprite) {
                cacheCtx.fillStyle = 'magenta';
                cacheCtx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                continue;
            }
            const screenX = x * tileSize;
            const screenY = y * tileSize;
            const drawSize = tileSize + 1;

            if (tile.spriteConfig) {
                const sWidth = tileSize;
                const sHeight = tile.spriteConfig.height || tileSize;
                const dWidth = drawSize;
                const dHeight = sHeight === tileSize ? drawSize : sHeight;
                cacheCtx.drawImage(sprite, tile.spriteConfig.srcX, tile.spriteConfig.srcY, sWidth, sHeight, screenX, screenY, dWidth, dHeight);
            } else {
                cacheCtx.drawImage(sprite, screenX, screenY, drawSize, drawSize);
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

  renderScene(camera, level, entityManager, collectedFruits) {
    camera.apply(this.ctx);

    this.drawTileGrid(level, camera);
    if (level.trophy) this.drawTrophy(level.trophy, camera);
    this.drawFruits(level.getActiveFruits(), camera);
    this.drawCheckpoints(level.checkpoints, camera);

    this.drawTraps(level.traps, camera);

    const entities = entityManager.query([PositionComponent, RenderableComponent]);
    for(const entityId of entities) {
        const pos = entityManager.getComponent(entityId, PositionComponent);
        const renderable = entityManager.getComponent(entityId, RenderableComponent);
        const charComp = entityManager.getComponent(entityId, CharacterComponent);
        const playerCtrl = entityManager.getComponent(entityId, PlayerControlledComponent);
        this._drawRenderable(pos, renderable, charComp, playerCtrl);
    }

    this.drawCollectedFruits(collectedFruits, camera);

    camera.restore(this.ctx);
  }

  _drawRenderable(pos, renderable, charComp, playerCtrl) {
    const stateName = renderable.animationState;
    if (!renderable.isVisible || (playerCtrl && playerCtrl.despawnAnimationFinished)) return;

    const stateToSpriteMap = {
      idle: 'playerIdle', run: 'playerRun', jump: 'playerJump',
      double_jump: 'playerDoubleJump', fall: 'playerFall',
      dash: 'playerDash', cling: 'playerCling', spawn: 'playerAppear',
      despawn: 'playerDisappear', hit: 'playerHit',
    };

    let sprite;
    const spriteAssetKey = stateToSpriteMap[stateName];

    if (stateName === 'spawn' || stateName === 'despawn') {
        sprite = this.assets[spriteAssetKey];
    }
    else if (charComp) {
        sprite = this.assets.characters[charComp.characterId]?.[spriteAssetKey] || this.assets.playerIdle;
    }
    else {
        sprite = this.assets[renderable.spriteKey];
    }

    if (!sprite) { this.ctx.fillStyle = '#FF00FF'; this.ctx.fillRect(pos.x, pos.y, renderable.width, renderable.height); return; }

    const frameCount = PLAYER_CONSTANTS.ANIMATION_FRAMES[stateName] || 1;
    const frameWidth = sprite.width / frameCount;
    const srcX = frameWidth * renderable.animationFrame;

    this.ctx.save();

    const isSpecialAnim = stateName === 'spawn' || stateName === 'despawn';
    const renderX = isSpecialAnim ? pos.x - (renderable.width - PLAYER_CONSTANTS.WIDTH) / 2 : pos.x;
    const renderY = isSpecialAnim ? pos.y - (renderable.height - PLAYER_CONSTANTS.HEIGHT) / 2 : pos.y;

    if (renderable.direction === 'left') {
      this.ctx.scale(-1, 1);
      this.ctx.translate(-renderX - renderable.width, renderY);
    } else {
      this.ctx.translate(renderX, renderY);
    }

    const drawOffsetX = (stateName === 'cling') ? PLAYER_CONSTANTS.CLING_OFFSET : 0;

    this.ctx.drawImage(
      sprite, srcX, 0, frameWidth, sprite.height,
      drawOffsetX, 0,
      renderable.width, renderable.height
    );
    this.ctx.restore();
  }

  drawTileGrid(level, camera) {
    if (this.staticLayerCache) {
        this.ctx.drawImage(this.staticLayerCache, 0, 0);
    }

    const tileSize = GRID_CONSTANTS.TILE_SIZE;
    const startCol = Math.floor(camera.x / tileSize), endCol = Math.ceil((camera.x + camera.width) / tileSize);
    const startRow = Math.floor(camera.y / tileSize), endRow = Math.ceil((camera.y + camera.height) / tileSize);

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        if (x < 0 || x >= level.gridWidth || y < 0 || y >= level.gridHeight) continue;

        const tile = level.tiles[y][x];
        if (tile.type === 'empty' || !tile.oneWay) continue;
        const sprite = this.assets[tile.spriteKey];
        if (!sprite) { this.ctx.fillStyle = 'magenta'; this.ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize); continue; }
        const screenX = x * tileSize, screenY = y * tileSize;

        const drawSize = tileSize + 1;

        if (tile.spriteConfig) {
            const sWidth = tileSize;
            const sHeight = tile.spriteConfig.height || tileSize;
            const dWidth = drawSize;


            const dHeight = sHeight === tileSize ? drawSize : sHeight;

            this.ctx.drawImage(sprite, tile.spriteConfig.srcX, tile.spriteConfig.srcY, sWidth, sHeight, screenX, screenY, dWidth, dHeight);
        } else {
            this.ctx.drawImage(sprite, screenX, screenY, drawSize, drawSize);
        }
      }
    }
  }

  drawTrophy(trophy, camera) {
    if (!camera.isVisible(trophy.x - trophy.size / 2, trophy.y - trophy.size / 2, trophy.size, trophy.size)) return;

    const isAnimating = trophy.isAnimating || trophy.acquired;
    const sprite = this.assets[isAnimating ? 'trophy_pressed' : 'trophy_idle'];
    if (!sprite) return;

    let frameWidth, srcX;

    if (isAnimating) {
        frameWidth = sprite.width / trophy.frameCount;
        srcX = frameWidth * trophy.animationFrame;
    } else {
        frameWidth = sprite.width;
        srcX = 0;
    }

    if (trophy.inactive) this.ctx.globalAlpha = 0.5;

    this.ctx.drawImage(sprite, srcX, 0, frameWidth, sprite.height, trophy.x - trophy.size / 2, trophy.y - trophy.size / 2, trophy.size, trophy.size);

    this.ctx.globalAlpha = 1.0;
  }

  drawFruits(fruits, camera) {
    for (const fruit of fruits) {
      if (!camera.isRectVisible({x: fruit.x - fruit.size/2, y: fruit.y - fruit.size/2, width: fruit.size, height: fruit.size})) continue;
      const img = this.assets[fruit.spriteKey]; if (!img) continue;
      const frameWidth = img.width / fruit.frameCount, srcX = frameWidth * fruit.frame;
      this.ctx.drawImage(img, srcX, 0, frameWidth, img.height, fruit.x - fruit.size / 2, fruit.y - fruit.size / 2, fruit.size, fruit.size);
    }
  }







  drawTraps(traps, camera) {
      for (const trap of traps) {
          trap.render(this.ctx, this.assets, camera);
      }
  }

  drawCollectedFruits(collectedArr, camera) {
    const sprite = this.assets['fruit_collected']; if (!sprite) return;
    const frameWidth = sprite.width / 6;
    for (const collected of collectedArr) {
      if (!camera.isRectVisible({x: collected.x, y: collected.y, width: collected.size, height: collected.size})) continue;
      const srcX = collected.frame * frameWidth;
      this.ctx.drawImage(sprite, srcX, 0, frameWidth, sprite.height, collected.x - collected.size / 2, collected.y - collected.size / 2, collected.size, collected.size);
    }
  }

  drawCheckpoints(checkpoints, camera) {
    for (const cp of checkpoints) {
      if (!camera.isRectVisible({x: cp.x, y: cp.y, width: cp.size, height: cp.size})) continue;
      let sprite, srcX = 0, frameWidth;
      switch(cp.state) {
        case 'inactive': sprite = this.assets.checkpoint_inactive; if (sprite) frameWidth = sprite.width; break;
        case 'activating': sprite = this.assets.checkpoint_activation; if (sprite) { frameWidth = sprite.width / cp.frameCount; srcX = cp.frame * frameWidth; } break;
        case 'active': sprite = this.assets.checkpoint_active; if (sprite) { const activeFrameCount = 10, currentFrame = Math.floor((performance.now() / 1000 / 0.1) % activeFrameCount); frameWidth = sprite.width / activeFrameCount; srcX = currentFrame * frameWidth; } break;
      }
      if (sprite && frameWidth > 0) this.ctx.drawImage(sprite, srcX, 0, frameWidth, sprite.height, cp.x - cp.size / 2, cp.y - cp.size / 2, cp.size, cp.size);
      else { this.ctx.fillStyle = 'purple'; this.ctx.fillRect(cp.x - cp.size / 2, cp.y - cp.size / 2, cp.size, cp.size); }
    }
  }
}