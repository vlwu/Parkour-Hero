import { createShaderProgram } from '../core/gl-utils.js';
import sceneVertexShader from '../shaders/scene.vert?raw';
import sceneFragmentShader from '../shaders/scene.frag?raw';
import backgroundVertexShader from '../shaders/background.vert?raw';
import backgroundFragmentShader from '../shaders/background.frag?raw';

import { PLAYER_CONSTANTS, GRID_CONSTANTS } from '../utils/constants.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { PreviousPositionComponent } from '../components/PreviousPositionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CharacterComponent } from '../components/CharacterComponent.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { TILESET_CONFIG, TILESET_CONFIG_SPECIAL, SPECIAL_TILE_ID_OFFSET, getTileProperties } from '../entities/tile-definitions.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { TrapComponent } from '../components/TrapComponent.js';

const MAX_SPRITES_PER_BATCH = 5000;
const ATTRIBUTES_PER_INSTANCE = 11;
const INSTANCE_STRIDE = ATTRIBUTES_PER_INSTANCE * 4;

const fractionalPlatformTypes = [
    'wood_third_h', 'wood_third_v', 'wood_ninth_sq', 'wood_four_ninths_sq',
    'stone_third_h', 'stone_third_v', 'stone_ninth_sq', 'stone_four_ninths_sq',
    'gold_third_h', 'gold_third_v', 'gold_ninth_sq', 'gold_four_ninths_sq',
    'orange_dirt_third_h', 'orange_dirt_third_v', 'orange_dirt_ninth_sq', 'orange_dirt_four_ninths_sq'
];

export class Renderer {
  constructor(gl, canvas, assets) {
    this.gl = gl;
    this.canvas = canvas;
    this.assets = assets;
    this.previewMode = false;
    this.backgroundOffset = { x: 0, y: 0 };
    this.currentLevel = null;

    this.sceneProgram = createShaderProgram(gl, sceneVertexShader, sceneFragmentShader);
    this.backgroundProgram = createShaderProgram(gl, backgroundVertexShader, backgroundFragmentShader);

    this.sceneUniforms = {
      projection: gl.getUniformLocation(this.sceneProgram, 'u_projection'),
      texture: gl.getUniformLocation(this.sceneProgram, 'u_texture'),
      texture_size: gl.getUniformLocation(this.sceneProgram, 'u_texture_size'),
    };
    this.backgroundUniforms = {
        texture: gl.getUniformLocation(this.backgroundProgram, 'u_texture'),
        resolution: gl.getUniformLocation(this.backgroundProgram, 'u_resolution'),
        camera_offset: gl.getUniformLocation(this.backgroundProgram, 'u_camera_offset'),
        camera_zoom: gl.getUniformLocation(this.backgroundProgram, 'u_camera_zoom'),
        texture_size: gl.getUniformLocation(this.backgroundProgram, 'u_texture_size'),
    };

    this.textures = {};
    this.syncTextures();

    const quadVertices = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0,
    ]);
    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    this.staticBatches = new Map();
    this.staticOverlayBatches = new Map();

    this.dynamicVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamicVBO);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_SPRITES_PER_BATCH * INSTANCE_STRIDE, gl.DYNAMIC_DRAW);
    this.dynamicVAO = gl.createVertexArray();
    this._setupVAO(this.dynamicVAO, this.dynamicVBO);
    this.dynamicInstanceData = new Float32Array(MAX_SPRITES_PER_BATCH * ATTRIBUTES_PER_INSTANCE);

    this.backgroundVAO = gl.createVertexArray();
  }

  _createTexture(image, wrap = false) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const wrapMode = wrap ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapMode);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapMode);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }

  syncTextures() {
    Object.keys(this.assets).forEach(key => {
        if (this.assets[key] instanceof HTMLImageElement && !this.textures[key]) {
            const isBackground = key.startsWith('background_');
            this.textures[key] = {
                glTexture: this._createTexture(this.assets[key], isBackground),
                width: this.assets[key].width,
                height: this.assets[key].height
            };
        }
    });

    if (!this.textures.characters) this.textures.characters = {};
    Object.keys(this.assets.characters).forEach(charId => {
        if (!this.textures.characters[charId]) this.textures.characters[charId] = {};
        Object.keys(this.assets.characters[charId]).forEach(spriteKey => {
            if (!this.textures.characters[charId][spriteKey]) {
                const img = this.assets.characters[charId][spriteKey];
                this.textures.characters[charId][spriteKey] = {
                    glTexture: this._createTexture(img),
                    width: img.width,
                    height: img.height
                };
            }
        });
    });
  }

  _setupVAO(vao, vbo) {
    const gl = this.gl;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, INSTANCE_STRIDE, 0);  gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, INSTANCE_STRIDE, 8);  gl.vertexAttribDivisor(2, 1);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 2, gl.FLOAT, false, INSTANCE_STRIDE, 16); gl.vertexAttribDivisor(3, 1);
    gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 2, gl.FLOAT, false, INSTANCE_STRIDE, 24); gl.vertexAttribDivisor(4, 1);
    gl.enableVertexAttribArray(5); gl.vertexAttribPointer(5, 1, gl.FLOAT, false, INSTANCE_STRIDE, 32); gl.vertexAttribDivisor(5, 1);
    gl.enableVertexAttribArray(6); gl.vertexAttribPointer(6, 1, gl.FLOAT, false, INSTANCE_STRIDE, 36); gl.vertexAttribDivisor(6, 1);
    gl.enableVertexAttribArray(7); gl.vertexAttribPointer(7, 1, gl.FLOAT, false, INSTANCE_STRIDE, 40); gl.vertexAttribDivisor(7, 1);

    gl.bindVertexArray(null);
  }

  preRenderLevel(level, entityManager) {
    this.currentLevel = level;
    const gl = this.gl;
    this.staticBatches.clear();
    this.staticOverlayBatches.clear();
    const staticGroups = new Map();
    const staticOverlayGroups = new Map();

    for (let y = 0; y < level.gridHeight; y++) {
        for (let x = 0; x < level.gridWidth; x++) {
            const tileId = level.tiles[y][x];
            if (tileId > 0) {
                const properties = getTileProperties(tileId);
                const isOverlay = properties && properties.interaction === 'mud';
                const targetGroups = isOverlay ? staticOverlayGroups : staticGroups;

                const isSpecial = tileId > SPECIAL_TILE_ID_OFFSET;
                const spriteKey = isSpecial ? 'sand_mud_ice' : 'block';
                if (!targetGroups.has(spriteKey)) {
                    targetGroups.set(spriteKey, []);
                }
                targetGroups.get(spriteKey).push({ tileId, x, y });
            }
        }
    }

    const trapEntities = entityManager.query([TrapComponent]);
    for (const entityId of trapEntities) {
        const trap = entityManager.getComponent(entityId, TrapComponent).trap;
        if (fractionalPlatformTypes.includes(trap.type)) {
            const spriteKey = 'block';
            if (!staticGroups.has(spriteKey)) {
                staticGroups.set(spriteKey, []);
            }
            staticGroups.get(spriteKey).push({ trap });
        }
    }

    for (const [spriteKey, groupItems] of staticGroups.entries()) {
        const staticData = [];
        groupItems.forEach(item => {
            if (item.tileId !== undefined) {
                const { tileId, x, y } = item;
                const isSpecial = tileId > SPECIAL_TILE_ID_OFFSET;
                const config = isSpecial ? TILESET_CONFIG_SPECIAL : TILESET_CONFIG;
                const localId = (isSpecial ? tileId - SPECIAL_TILE_ID_OFFSET : tileId) - 1;

                const sx = (localId % config.columns) * config.tileWidth;
                const sy = Math.floor(localId / config.columns) * config.tileHeight;

                staticData.push(
                    x * GRID_CONSTANTS.TILE_SIZE, y * GRID_CONSTANTS.TILE_SIZE,
                    GRID_CONSTANTS.TILE_SIZE, GRID_CONSTANTS.TILE_SIZE,
                    sx, sy,
                    config.tileWidth, config.tileHeight,
                    0.0, 1.0, 0.0
                );
            } else if (item.trap) {
                const { trap } = item;
                staticData.push(
                    trap.x - trap.width / 2, trap.y - trap.height / 2,
                    trap.width, trap.height,
                    trap.spriteConfig.srcX, trap.spriteConfig.srcY,
                    trap.spriteConfig.width, trap.spriteConfig.height,
                    0.0, 1.0, 0.0
                );
            }
        });

        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(staticData), gl.STATIC_DRAW);
        const vao = gl.createVertexArray();
        this._setupVAO(vao, vbo);

        this.staticBatches.set(spriteKey, {
            vao,
            instanceCount: staticData.length / ATTRIBUTES_PER_INSTANCE,
            texture: this.textures[spriteKey]
        });
    }

    for (const [spriteKey, groupItems] of staticOverlayGroups.entries()) {
        const staticData = [];
        groupItems.forEach(item => {
            if (item.tileId !== undefined) {
                const { tileId, x, y } = item;
                const isSpecial = tileId > SPECIAL_TILE_ID_OFFSET;
                const config = isSpecial ? TILESET_CONFIG_SPECIAL : TILESET_CONFIG;
                const localId = (isSpecial ? tileId - SPECIAL_TILE_ID_OFFSET : tileId) - 1;
                const sx = (localId % config.columns) * config.tileWidth;
                const sy = Math.floor(localId / config.columns) * config.tileHeight;
                staticData.push(
                    x * GRID_CONSTANTS.TILE_SIZE, y * GRID_CONSTANTS.TILE_SIZE,
                    GRID_CONSTANTS.TILE_SIZE, GRID_CONSTANTS.TILE_SIZE,
                    sx, sy,
                    config.tileWidth, config.tileHeight,
                    0.0, 1.0, 0.0
                );
            }
        });
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(staticData), gl.STATIC_DRAW);
        const vao = gl.createVertexArray();
        this._setupVAO(vao, vbo);
        this.staticOverlayBatches.set(spriteKey, {
            vao,
            instanceCount: staticData.length / ATTRIBUTES_PER_INSTANCE,
            texture: this.textures[spriteKey]
        });
    }
  }

  update(dt) {
      if (this.currentLevel) {
          this.backgroundOffset.x += this.currentLevel.backgroundScroll.x * dt;
          this.backgroundOffset.y += this.currentLevel.backgroundScroll.y * dt;
      }
  }

  renderScene(camera, level, entityManager, alpha) {
    const gl = this.gl;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.drawScrollingBackground(camera, level, alpha);

    gl.useProgram(this.sceneProgram);
    gl.uniformMatrix4fv(this.sceneUniforms.projection, false, camera.getProjectionMatrix(alpha));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    for (const [_, batch] of this.staticBatches.entries()) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, batch.texture.glTexture);
        gl.uniform1i(this.sceneUniforms.texture, 0);
        gl.uniform2f(this.sceneUniforms.texture_size, batch.texture.width, batch.texture.height);
        gl.bindVertexArray(batch.vao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, batch.instanceCount);
    }

    this._batchAndDrawDynamicObjects(camera, level, entityManager, alpha);

    for (const [_, batch] of this.staticOverlayBatches.entries()) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, batch.texture.glTexture);
        gl.uniform1i(this.sceneUniforms.texture, 0);
        gl.uniform2f(this.sceneUniforms.texture_size, batch.texture.width, batch.texture.height);
        gl.bindVertexArray(batch.vao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, batch.instanceCount);
    }

    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
  }

    _batchAndDrawDynamicObjects(camera, level, entityManager, alpha) {
        const gl = this.gl;
        const batches = new Map();

        const addToBatch = (textureRef, instanceData) => {
            if (!textureRef || !textureRef.glTexture) return;
            const key = textureRef.glTexture;
            if (!batches.has(key)) batches.set(key, { texture: textureRef, instances: [] });
            batches.get(key).instances.push(...instanceData);
        };

        const entities = entityManager.query([PositionComponent, RenderableComponent, CollisionComponent]);
        for (const entityId of entities) {
            const renderable = entityManager.getComponent(entityId, RenderableComponent);
            if (!renderable.isVisible || (this.previewMode && entityManager.hasComponent(entityId, PlayerControlledComponent))) continue;

            const pos = entityManager.getComponent(entityId, PositionComponent);
            const prevPos = entityManager.getComponent(entityId, PreviousPositionComponent);
            let renderX = prevPos ? prevPos.x + (pos.x - prevPos.x) * alpha : pos.x;
            let renderY = prevPos ? prevPos.y + (pos.y - prevPos.y) * alpha : pos.y;
            const col = entityManager.getComponent(entityId, CollisionComponent);

            const isPlayer = entityManager.hasComponent(entityId, CharacterComponent);
            const isEnemy = entityManager.hasComponent(entityId, EnemyComponent);

            if (isPlayer) {
                const playerCtrl = entityManager.getComponent(entityId, PlayerControlledComponent);
                let offsetX, offsetY;

                if (playerCtrl.isSpawning || playerCtrl.isDespawning) {
                    offsetX = (col.width - renderable.width) / 2;
                    offsetY = (col.height - renderable.height) / 2;
                } else {
                    offsetX = (col.width - renderable.width) / 2;
                    offsetY = (col.height - renderable.height);
                }
                
                renderX += offsetX;
                renderY += offsetY;
                
                if (renderable.animationState === 'cling') {
                    const clingOffset = renderable.direction === 'left' ? -PLAYER_CONSTANTS.CLING_OFFSET : PLAYER_CONSTANTS.CLING_OFFSET;
                    renderX += clingOffset;
                }
            }

            if (isEnemy) {
                if (renderable.width > col.width) {
                    const enemy = entityManager.getComponent(entityId, EnemyComponent);
                    if (enemy.type === 'chameleon') {
                        if (renderable.direction === 'left') {
                            renderX -= (renderable.width - col.width);
                        }
                    } else {
                        renderX -= (renderable.width - col.width) / 2;
                    }
                }
            }

            let spriteData;
            if (isPlayer) {
                spriteData = this._getPlayerSpriteData(renderable, entityManager.getComponent(entityId, CharacterComponent));
            } else if (isEnemy) {
                spriteData = this._getEnemySpriteData(renderable);
            } else {
                 const sprite = this.assets[renderable.spriteKey];
                 const texture = this.textures[renderable.spriteKey];
                 if(sprite && texture) {
                     spriteData = { texture, sx: 0, sy: 0, sw: sprite.width, sh: sprite.height, isFlipped: 0.0};
                 }
            }

            if (spriteData) {
                const instanceData = [renderX, renderY, renderable.width, renderable.height, spriteData.sx, spriteData.sy, spriteData.sw, spriteData.sh, spriteData.isFlipped, 1.0, renderable.rotation || 0.0];
                addToBatch(spriteData.texture, instanceData);
            }
        }

        const trapEntities = entityManager.query([TrapComponent]);
        for (const entityId of trapEntities) {
            const trap = entityManager.getComponent(entityId, TrapComponent).trap;
            if (fractionalPlatformTypes.includes(trap.type)) continue;
            if (typeof trap.getRenderableData === 'function') {
                const trapRenderData = trap.getRenderableData(this.assets, this.textures);
                if (trapRenderData) {
                    const dataArray = Array.isArray(trapRenderData) ? trapRenderData : [trapRenderData];
                    dataArray.forEach(d => {
                        if (d && d.texture && d.instanceData) {
                             const finalInstanceData = [...d.instanceData, d.alpha !== undefined ? d.alpha : 1.0, d.rotation !== undefined ? d.rotation : 0.0];
                            addToBatch(d.texture, finalInstanceData);
                        }
                    });
                }
            }
        }

        level.fruits.forEach(f => {
            if (!f.collected) {
                const sprite = this.assets[f.spriteKey];
                const tex = this.textures[f.spriteKey];
                const frameWidth = sprite.width / f.frameCount;
                const instanceData = [f.x - f.size / 2, f.y - f.size / 2, f.size, f.size, f.frame * frameWidth, 0, frameWidth, sprite.height, 0.0, 1.0, 0.0];
                addToBatch(tex, instanceData);
            }
        });

        level.checkpoints.forEach(cp => {
            const {sprite, tex, srcX, frameWidth} = this._getCheckpointSpriteData(cp);
            const instanceData = [cp.x - cp.size / 2, cp.y - cp.size / 2, cp.size, cp.size, srcX, 0, frameWidth, sprite.height, 0.0, 1.0, 0.0];
            addToBatch(tex, instanceData);
        });

        if (level.trophy) {
            const alpha = level.trophy.inactive ? 0.5 : 1.0;
            const {sprite, tex, srcX, frameWidth} = this._getTrophySpriteData(level.trophy);
            const instanceData = [level.trophy.x - level.trophy.size / 2, level.trophy.y - level.trophy.size / 2, level.trophy.size, level.trophy.size, srcX, 0, frameWidth, sprite.height, 0.0, alpha, 0.0];
            addToBatch(tex, instanceData);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamicVBO);
        gl.bindVertexArray(this.dynamicVAO);

        for (const [_, batch] of batches.entries()) {
            const instanceCount = batch.instances.length / ATTRIBUTES_PER_INSTANCE;
            if (instanceCount === 0) continue;

            this.dynamicInstanceData.set(batch.instances);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.dynamicInstanceData.subarray(0, batch.instances.length));

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, batch.texture.glTexture);
            gl.uniform1i(this.sceneUniforms.texture, 0);
            gl.uniform2f(this.sceneUniforms.texture_size, batch.texture.width, batch.texture.height);

            gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, instanceCount);
        }
  }

  _getPlayerSpriteData(renderable, charComp) {
    const stateName = renderable.animationState;
    const stateToSpriteMap = {
      idle: 'playerIdle', run: 'playerRun', jump: 'playerJump',
      double_jump: 'playerDoubleJump', fall: 'playerFall',
      dash: 'playerDash', cling: 'playerCling', spawn: 'playerAppear',
      despawn: 'playerDisappear', hit: 'playerHit',
    };
    const spriteAssetKey = stateToSpriteMap[stateName];
    const isSpecialAnim = stateName === 'spawn' || stateName === 'despawn';

    const sprite = isSpecialAnim ? this.assets[spriteAssetKey] : this.assets.characters[charComp.characterId]?.[spriteAssetKey];
    if (!sprite) return null;

    const texture = isSpecialAnim ? this.textures[spriteAssetKey] : this.textures.characters[charComp.characterId]?.[spriteAssetKey];

    const animDef = PLAYER_CONSTANTS.ANIMATIONS[stateName];
    const frameCount = animDef ? animDef.frameCount : 1;
    const frameWidth = sprite.width / frameCount;
    const srcX = frameWidth * renderable.animationFrame;
    const isFlipped = renderable.direction === 'left' ? 1.0 : 0.0;

    return { texture, sx: srcX, sy: 0, sw: frameWidth, sh: sprite.height, isFlipped };
  }

  _getEnemySpriteData(renderable) {
    const enemyDef = ENEMY_DEFINITIONS[renderable.spriteKey];
    if (!enemyDef) return null;

    const assetKey = `${renderable.spriteKey}_${renderable.animationState}`;
    const sprite = this.assets[assetKey];
    const texture = this.textures[assetKey];
    if (!sprite || !texture) return null;

    const frameCount = enemyDef.animations[renderable.animationState]?.frameCount || 1;
    const frameWidth = sprite.width / frameCount;
    const srcX = (renderable.animationFrame % frameCount) * frameWidth;

    let isFlipped;
    if (renderable.spriteKey === 'skull') {
      isFlipped = renderable.direction === 'left' ? 1.0 : 0.0;
    } else {
      isFlipped = renderable.direction === 'right' ? 1.0 : 0.0;
    }

    return { texture, sx: srcX, sy: 0, sw: frameWidth, sh: sprite.height, isFlipped };
  }

  _getCheckpointSpriteData(cp) {
    let sprite, tex, srcX = 0, frameWidth;
    switch(cp.state) {
        case 'inactive':
            sprite = this.assets.checkpoint_inactive;
            tex = this.textures.checkpoint_inactive;
            if(sprite) frameWidth = sprite.width;
            break;
        case 'activating':
            sprite = this.assets.checkpoint_activation;
            tex = this.textures.checkpoint_activation;
            if(sprite) { frameWidth = sprite.width / cp.frameCount; srcX = cp.frame * frameWidth; }
            break;
        case 'active':
            sprite = this.assets.checkpoint_active;
            tex = this.textures.checkpoint_active;
            if(sprite) { const activeFrameCount = 10; const currentFrame = Math.floor((performance.now() / 1000 / 0.1) % activeFrameCount); frameWidth = sprite.width / activeFrameCount; srcX = currentFrame * frameWidth; }
            break;
    }
    return {sprite, tex, srcX, frameWidth};
  }

  _getTrophySpriteData(trophy) {
      const isAnimating = trophy.isAnimating || trophy.acquired;
      const spriteKey = isAnimating ? 'trophy_pressed' : 'trophy_idle';
      const sprite = this.assets[spriteKey];
      const tex = this.textures[spriteKey];
      let frameWidth = sprite.width;
      let srcX = 0;
      if (isAnimating && trophy.frameCount > 0) {
          frameWidth = sprite.width / trophy.frameCount;
          srcX = frameWidth * trophy.animationFrame;
      }
      return { sprite, tex, srcX, frameWidth };
  }

  drawScrollingBackground(camera, level, alpha) {
    const gl = this.gl;
    const bgAssetKey = level.background;
    const textureInfo = this.textures[bgAssetKey];
    if (!textureInfo) return;

    gl.useProgram(this.backgroundProgram);
    gl.bindVertexArray(this.backgroundVAO);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureInfo.glTexture);
    gl.uniform1i(this.backgroundUniforms.texture, 0);

    const renderX = camera.prevX + (camera.x - camera.prevX) * alpha;
    const renderY = camera.prevY + (camera.y - camera.prevY) * alpha;

    gl.uniform2f(this.backgroundUniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.backgroundUniforms.camera_offset, renderX + this.backgroundOffset.x, renderY + this.backgroundOffset.y);
    gl.uniform1f(this.backgroundUniforms.camera_zoom, camera.zoom);
    gl.uniform2f(this.backgroundUniforms.texture_size, textureInfo.width, textureInfo.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }
}