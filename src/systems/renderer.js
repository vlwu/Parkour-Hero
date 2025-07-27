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

const MAX_SPRITES_PER_BATCH = 5000;
const ATTRIBUTES_PER_INSTANCE = 10; // Changed from 9 to 10 to include alpha
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
    this._initializeTextures();

    const quadVertices = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    this.staticBatches = new Map();

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

  _initializeTextures() {
    Object.keys(this.assets).forEach(key => {
        if (this.assets[key] instanceof HTMLImageElement) {
            const isBackground = key.startsWith('background_');
            this.textures[key] = {
                glTexture: this._createTexture(this.assets[key], isBackground),
                width: this.assets[key].width,
                height: this.assets[key].height
            };
        }
    });

    this.textures.characters = {};
    Object.keys(this.assets.characters).forEach(charId => {
        this.textures.characters[charId] = {};
        Object.keys(this.assets.characters[charId]).forEach(spriteKey => {
            const img = this.assets.characters[charId][spriteKey];
            this.textures.characters[charId][spriteKey] = {
                glTexture: this._createTexture(img),
                width: img.width,
                height: img.height
            };
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
    // Add the new alpha attribute
    gl.enableVertexAttribArray(6); gl.vertexAttribPointer(6, 1, gl.FLOAT, false, INSTANCE_STRIDE, 36); gl.vertexAttribDivisor(6, 1);

    gl.bindVertexArray(null);
  }

  preRenderLevel(level) {
    this.currentLevel = level;
    const gl = this.gl;
    this.staticBatches.clear();
    const staticGroups = new Map();

    const addToStaticGroup = (item, spriteKey) => {
        if (!staticGroups.has(spriteKey)) {
            staticGroups.set(spriteKey, []);
        }
        staticGroups.get(spriteKey).push(item);
    };

    for (let y = 0; y < level.gridHeight; y++) {
        for (let x = 0; x < level.gridWidth; x++) {
            const tile = level.tiles[y][x];
            if (tile.solid && tile.spriteConfig) {
                addToStaticGroup({ tile, x, y }, tile.spriteKey);
            }
        }
    }

    level.traps.forEach(trap => {
        if (fractionalPlatformTypes.includes(trap.type)) {
            addToStaticGroup({ trap }, 'block');
        }
    });

    for (const [spriteKey, items] of staticGroups.entries()) {
        const staticData = [];
        items.forEach(item => {
            if (item.tile) {
                const { tile, x, y } = item;
                const dWidth = tile.collisionBox ? tile.collisionBox.width : GRID_CONSTANTS.TILE_SIZE;
                const dHeight = tile.collisionBox ? tile.collisionBox.height : GRID_CONSTANTS.TILE_SIZE;
                const finalDHeight = tile.oneWay && !tile.collisionBox ? tile.spriteConfig.height : dHeight;
                staticData.push(
                    x * GRID_CONSTANTS.TILE_SIZE, y * GRID_CONSTANTS.TILE_SIZE,
                    dWidth, finalDHeight,
                    tile.spriteConfig.srcX, tile.spriteConfig.srcY,
                    tile.spriteConfig.width || GRID_CONSTANTS.TILE_SIZE, tile.spriteConfig.height || GRID_CONSTANTS.TILE_SIZE,
                    0.0, 1.0 // isFlipped, alpha
                );
            } else if (item.trap) {
                const { trap } = item;
                staticData.push(
                    trap.x - trap.width / 2, trap.y - trap.height / 2,
                    trap.width, trap.height,
                    trap.spriteConfig.srcX, trap.spriteConfig.srcY,
                    trap.spriteConfig.width, trap.spriteConfig.height,
                    0.0, 1.0 // isFlipped, alpha
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
            instanceCount: items.length,
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

        const entities = entityManager.query([PositionComponent, RenderableComponent]);
        for (const entityId of entities) {
            const renderable = entityManager.getComponent(entityId, RenderableComponent);
            if (!renderable.isVisible || (this.previewMode && entityManager.hasComponent(entityId, PlayerControlledComponent))) continue;

            const pos = entityManager.getComponent(entityId, PositionComponent);
            const prevPos = entityManager.getComponent(entityId, PreviousPositionComponent);
            
            let renderX = prevPos ? prevPos.x + (pos.x - prevPos.x) * alpha : pos.x;
            let renderY = prevPos ? prevPos.y + (pos.y - prevPos.y) * alpha : pos.y;
            
            const isPlayer = entityManager.hasComponent(entityId, CharacterComponent);
            if (isPlayer) {
                const stateName = renderable.animationState;
                const isSpecialAnim = stateName === 'spawn' || stateName === 'despawn';
                if (isSpecialAnim) {
                    renderX -= (renderable.width - PLAYER_CONSTANTS.WIDTH) / 2;
                    renderY -= (renderable.height - PLAYER_CONSTANTS.HEIGHT) / 2;
                } else if (stateName === 'cling') {
                    const offset = renderable.direction === 'left' ? -PLAYER_CONSTANTS.CLING_OFFSET : PLAYER_CONSTANTS.CLING_OFFSET;
                    renderX += offset;
                }
            }

            const spriteData = isPlayer
                ? this._getPlayerSpriteData(renderable, entityManager.getComponent(entityId, CharacterComponent))
                : this._getEnemySpriteData(renderable);

            if (spriteData) {
                const instanceData = [renderX, renderY, renderable.width, renderable.height, spriteData.sx, spriteData.sy, spriteData.sw, spriteData.sh, spriteData.isFlipped, 1.0];
                addToBatch(spriteData.texture, instanceData);
            }
        }

        level.traps.forEach(trap => {
            if (fractionalPlatformTypes.includes(trap.type)) return;
            if (typeof trap.getRenderableData === 'function') {
                const trapRenderData = trap.getRenderableData(this.assets, this.textures);
                if (trapRenderData) {
                    const dataArray = Array.isArray(trapRenderData) ? trapRenderData : [trapRenderData];
                    dataArray.forEach(d => {
                        if (d && d.texture && d.instanceData) {
                            const finalInstanceData = [...d.instanceData, 1.0];
                            addToBatch(d.texture, finalInstanceData);
                        }
                    });
                }
            }
        });

        level.fruits.forEach(f => {
            if (!f.collected) {
                const sprite = this.assets[f.spriteKey];
                const tex = this.textures[f.spriteKey];
                const frameWidth = sprite.width / f.frameCount;
                const instanceData = [f.x - f.size / 2, f.y - f.size / 2, f.size, f.size, f.frame * frameWidth, 0, frameWidth, sprite.height, 0.0, 1.0];
                addToBatch(tex, instanceData);
            }
        });

        level.checkpoints.forEach(cp => {
            const {sprite, tex, srcX, frameWidth} = this._getCheckpointSpriteData(cp);
            const instanceData = [cp.x - cp.size / 2, cp.y - cp.size / 2, cp.size, cp.size, srcX, 0, frameWidth, sprite.height, 0.0, 1.0];
            addToBatch(tex, instanceData);
        });

        if (level.trophy) {
            const alpha = level.trophy.inactive ? 0.5 : 1.0;
            const {sprite, tex, srcX, frameWidth} = this._getTrophySpriteData(level.trophy);
            const instanceData = [level.trophy.x - level.trophy.size / 2, level.trophy.y - level.trophy.size / 2, level.trophy.size, level.trophy.size, srcX, 0, frameWidth, sprite.height, 0.0, alpha];
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

    const frameCount = PLAYER_CONSTANTS.ANIMATION_FRAMES[stateName] || 1;
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
    const isFlipped = renderable.direction === 'right' ? 1.0 : 0.0;

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