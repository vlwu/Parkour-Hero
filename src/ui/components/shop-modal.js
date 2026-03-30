import { LitElement, html, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { eventBus } from '../../utils/event-bus.js';
import { COSMETICS } from '../../utils/constants.js';
import { ParticleSystemWebGL } from '../../systems/particle-system-webgl.js';
import './bitmap-text.js';
import './animated-sprite-card.js';

export class ShopModal extends LitElement {
  static styles = css`
    :host { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .modal-overlay {
      position: absolute; inset: 0; background-color: rgba(0, 0, 0, 0.75);
      display: flex; justify-content: center; align-items: center; z-index: 250;
    }
    .modal-content {
      background-color: #333; padding: 25px; border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8); color: #eee;
      text-align: center; position: relative; width: 95%;
      max-width: 850px; max-height: 85vh; display: flex; flex-direction: column;
    }
    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('/assets/Menu/Buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer; transition: transform 0.2s ease-in-out; z-index: 10;
    }
    .close-button:hover { transform: scale(1.1); }
    
    .header {
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px;
        margin-bottom: 20px; border-bottom: 2px solid #555; padding-bottom: 15px; flex-shrink: 0;
    }
    .coin-display {
        display: flex; align-items: center; gap: 10px;
        background: rgba(0,0,0,0.4); padding: 8px 15px; border-radius: 20px;
        border: 2px solid #f1c40f;
    }

    .main-area {
        display: flex; gap: 25px; flex-grow: 1; overflow: hidden; min-height: 0;
    }
    
    .left-panel {
        display: flex; flex-direction: column; align-items: center; width: 180px; flex-shrink: 0;
    }
    .preview-box {
        width: 150px; height: 150px; background-color: #222;
        border: 2px solid #555; border-radius: 8px; position: relative;
        margin-bottom: 15px; overflow: hidden;
    }
    .preview-box canvas {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        image-rendering: pixelated;
    }
    .preview-label {
        margin-top: 10px;
    }

    .right-panel {
        display: flex; flex-direction: column; flex-grow: 1; overflow: hidden;
    }

    .tabs {
        display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; flex-shrink: 0;
    }
    .tab-button {
        background-color: #444; border: 2px solid #666; color: white;
        padding: 10px 5px; border-radius: 8px; cursor: pointer;
        transition: all 0.2s; flex: 1; max-width: none;
    }
    .tab-button.active { background-color: #007bff; border-color: #0056b3; }
    .tab-button:hover:not(.active) { background-color: #555; }

    .items-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 15px; overflow-y: auto; padding: 5px; flex-grow: 1;
    }
    
    .shop-item {
        background-color: #444; border: 2px solid #666; border-radius: 8px;
        padding: 15px; display: flex; flex-direction: column; align-items: center; gap: 10px;
        transition: transform 0.2s, border-color 0.2s; cursor: crosshair;
    }
    .shop-item.equipped { border-color: #4CAF50; background-color: #3d4a3e; }
    .shop-item:hover { transform: translateY(-3px); border-color: #007bff; }

    .item-name { margin-bottom: auto; }
    
    .buy-button {
        width: 100%; padding: 10px; border-radius: 6px; border: none;
        cursor: pointer; font-weight: bold; transition: background-color 0.2s;
        display: flex; justify-content: center; align-items: center; gap: 5px;
    }
    .buy-button.purchase { background-color: #f39c12; color: white; }
    .buy-button.purchase:hover { background-color: #e67e22; }
    .buy-button.purchase:disabled { background-color: #7f8c8d; cursor: not-allowed; }
    
    .buy-button.equip { background-color: #007bff; color: white; }
    .buy-button.equip:hover { background-color: #0056b3; }
    
    .buy-button.equipped { background-color: #4CAF50; color: white; cursor: default; }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #2a2a2a; border-radius: 4px; }
    ::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #777; }
  `;

  static properties = {
    gameState: { type: Object },
    fontRenderer: { type: Object },
    assets: { type: Object },
    activeTab: { type: String, state: true },
    previewedItem: { type: String, state: true }
  };

  constructor() {
    super();
    this.activeTab = 'dash';
    this.previewFrameId = null;
    this.particleSystem = null;
  }

  firstUpdated() {
      this.previewedItem = this.gameState?.equippedCosmetics?.[this.activeTab];
      this._startPreviewLoop();
  }

  updated(changedProperties) {
      if (changedProperties.has('activeTab') && this.gameState) {
          this.previewedItem = this.gameState.equippedCosmetics[this.activeTab];
          if (this.particleSystem) this.particleSystem.reset();
      }
  }

  disconnectedCallback() {
      super.disconnectedCallback();
      if (this.previewFrameId) cancelAnimationFrame(this.previewFrameId);
  }

  _startPreviewLoop() {
      if (this.previewFrameId) cancelAnimationFrame(this.previewFrameId);
      
      const bgCanvas = this.shadowRoot.getElementById('preview-bg');
      const fxCanvas = this.shadowRoot.getElementById('preview-fx');
      if (!bgCanvas || !fxCanvas) return;

      if (!this.tintCanvas) {
          this.tintCanvas = document.createElement('canvas');
          this.tintCanvas.width = 32;
          this.tintCanvas.height = 32;
          this.tintCtx = this.tintCanvas.getContext('2d');
      }

      const gl = fxCanvas.getContext('webgl2', { alpha: true });
      if (!this.particleSystem) {
          this.particleSystem = new ParticleSystemWebGL(gl, this.assets);
      }
      this.particleSystem.syncTextures();

      let lastTime = performance.now();
      let stateTime = 0;
      let playerPos = { x: 75, y: 75 };
      let direction = 1;
      let particleTimer = 0;
      let ghostTrails = [];

      const dummyCamera = {
          getProjectionMatrix: () => {
              const m = new Float32Array(16);
              m[0] = 2/150; m[5] = -2/150; m[10] = -1; m[15] = 1;
              m[12] = -1; m[13] = 1;
              return m;
          }
      };

      const loop = (timestamp) => {
          if (!this.isConnected) return;
          const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
          lastTime = timestamp;
          stateTime += dt;

          gl.clear(gl.COLOR_BUFFER_BIT);

          const ctx = bgCanvas.getContext('2d');
          ctx.clearRect(0, 0, 150, 150);

          let drawPlayer = true;
          const charId = this.gameState?.selectedCharacter || 'PinkMan';
          const playerSprite = this.assets?.characters?.[charId]?.playerIdle;

          for (let i = ghostTrails.length - 1; i >= 0; i--) {
              const ghost = ghostTrails[i];
              ghost.life -= dt;
              ghost.x += ghost.vx * dt;
              ghost.y += ghost.vy * dt;
              if (ghost.life <= 0) {
                  ghostTrails.splice(i, 1);
              }
          }

          const categoryItems = COSMETICS[this.activeTab] || [];
          const currentItem = categoryItems.find(c => c.id === this.previewedItem);
          const previewConf = currentItem ? currentItem.preview : null;

          if (previewConf && previewConf.type === 'dash') {
              playerPos.x += direction * 200 * dt;
              if (playerPos.x > 120) direction = -1;
              if (playerPos.x < 30) direction = 1;
              
              particleTimer += dt;
              if (particleTimer > 0.06) {
                  particleTimer = 0;
                  if (previewConf.ghost) {
                      ghostTrails.push({
                          x: playerPos.x, y: playerPos.y,
                          vx: 0, vy: 0,
                          life: 0.3, maxLife: 0.3,
                          dir: direction,
                          frame: Math.floor(timestamp / 100) % 11,
                          color: [153, 51, 255, 0.6]
                      });
                  } else if (previewConf.particle) {
                      this.particleSystem.create({
                          x: playerPos.x, y: playerPos.y,
                          type: previewConf.particle,
                          direction: direction === 1 ? 'right' : 'left'
                      });
                  }
              }
          } else if (previewConf && previewConf.type === 'death') {
              if (stateTime > 2.0) {
                  stateTime = 0;
                  if (previewConf.particle) {
                      this.particleSystem.create({
                          x: 75, y: 75, type: previewConf.particle
                      });
                  }
              }
              if (stateTime < 1.0) drawPlayer = false; 
              playerPos = { x: 75, y: 75 };
          } else if (previewConf && previewConf.type === 'aura') {
              playerPos = { x: 75, y: 75 };
              particleTimer += dt;
              if (currentItem.auraConfig) {
                  if (currentItem.auraConfig.particleType && particleTimer > currentItem.auraConfig.emitRate) {
                      particleTimer = 0;
                      this.particleSystem.create({ type: currentItem.auraConfig.particleType, x: 75, y: 90 });
                  } else if (currentItem.auraConfig.ghostTrail && particleTimer > currentItem.auraConfig.emitRate) {
                      particleTimer = 0;
                      ghostTrails.push({
                          x: playerPos.x + (Math.random() - 0.5) * 4,
                          y: playerPos.y + (Math.random() - 0.5) * 4,
                          vx: (Math.random() - 0.5) * 10,
                          vy: -15,
                          life: 0.5, maxLife: 0.5,
                          dir: 1,
                          frame: Math.floor(timestamp / 100) % 11,
                          color: [25, 0, 51, 0.7]
                      });
                  } else if (currentItem.auraConfig.orbiting && particleTimer > currentItem.auraConfig.emitRate) {
                      particleTimer = 0;
                      const angle1 = performance.now() / 300;
                      const angle2 = angle1 + Math.PI;
                      const radius = 20;
                      this.particleSystem.create({ type: 'orbit_node', x: 75 + Math.cos(angle1)*radius, y: 75 + Math.sin(angle1)*radius });
                      this.particleSystem.create({ type: 'orbit_node', x: 75 + Math.cos(angle2)*radius, y: 75 + Math.sin(angle2)*radius });
                  }
              }
          } else if (previewConf && previewConf.type === 'mutator') {
              const speed = previewConf.speed || 4;
              const amp = previewConf.amp || 5;
              playerPos = { x: 75, y: 75 + Math.sin(stateTime * speed) * amp };
          } else {
              playerPos = { x: 75, y: 75 };
          }

          if (playerSprite) {
              const frameWidth = playerSprite.width / 11;
              for (const ghost of ghostTrails) {
                  this.tintCtx.clearRect(0, 0, 32, 32);
                  this.tintCtx.imageSmoothingEnabled = false;
                  this.tintCtx.drawImage(playerSprite, ghost.frame * frameWidth, 0, frameWidth, playerSprite.height, 0, 0, 32, 32);
                  this.tintCtx.globalCompositeOperation = 'source-in';
                  this.tintCtx.fillStyle = `rgb(${ghost.color[0]}, ${ghost.color[1]}, ${ghost.color[2]})`;
                  this.tintCtx.fillRect(0, 0, 32, 32);
                  this.tintCtx.globalCompositeOperation = 'source-over';

                  ctx.save();
                  ctx.translate(ghost.x, ghost.y);
                  if (ghost.dir === -1) ctx.scale(-1, 1);
                  ctx.globalAlpha = (ghost.life / ghost.maxLife) * ghost.color[3];
                  
                  ctx.drawImage(this.tintCanvas, -16, -16);
                  ctx.restore();
              }
          }

          if (drawPlayer && playerSprite) {
              const frameWidth = playerSprite.width / 11;
              const frame = Math.floor(timestamp / 100) % 11;
              
              ctx.save();
              ctx.translate(playerPos.x, playerPos.y);
              if (direction === -1) ctx.scale(-1, 1);
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(playerSprite, frame * frameWidth, 0, frameWidth, playerSprite.height, -16, -16, 32, 32);
              ctx.restore();
          }

          this.particleSystem.update(dt);
          this.particleSystem.render(dummyCamera);

          this.previewFrameId = requestAnimationFrame(loop);
      };
      this.previewFrameId = requestAnimationFrame(loop);
  }

  _setPreviewItem(id) {
      if (this.previewedItem !== id) {
          this.previewedItem = id;
          if (this.particleSystem) this.particleSystem.reset();
      }
  }

  _dispatchClose() {
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
    this.dispatchEvent(new CustomEvent('close-modal', { bubbles: true, composed: true }));
  }

  _handleAction(item, category) {
      const isUnlocked = this.gameState.unlockedCosmetics.includes(item.id);
      
      if (isUnlocked) {
          const newState = this.gameState._clone();
          newState.equipCosmetic(category, item.id);
          eventBus.publish('gameStateUpdated', newState);
          eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
      } else {
          if (this.gameState.fruitCoins >= item.cost) {
              const newState = this.gameState._clone();
              newState.fruitCoins -= item.cost;
              newState.unlockCosmetic(item.id);
              newState.equipCosmetic(category, item.id);
              eventBus.publish('gameStateUpdated', newState);
              eventBus.publish('playSound', { key: 'trophy_activated', volume: 0.8, channel: 'UI' });
          } else {
              eventBus.publish('playSound', { key: 'hit', volume: 0.5, channel: 'UI' });
          }
      }
  }

  render() {
    if (!this.gameState || !this.fontRenderer) return html``;

    const items = COSMETICS[this.activeTab] || [];
    const equippedId = this.gameState.equippedCosmetics[this.activeTab];
    const previewName = items.find(c => c.id === this.previewedItem)?.name || 'None';

    return html`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e => e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>

          <div class="header">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Cosmetics Shop" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
            <div class="coin-display">
                <animated-sprite-card bare scaleToFit style="width:32px; height:32px;" .sprite=${this.assets?.coin_icon} .frameCount=${14} .frameSpeed=${0.05}></animated-sprite-card>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="${this.gameState.fruitCoins}" scale="2" color="#f1c40f"></bitmap-text>
            </div>
          </div>

          <div class="main-area">
              <div class="left-panel">
                  <div class="preview-box">
                      <canvas id="preview-bg" width="150" height="150"></canvas>
                      <canvas id="preview-fx" width="150" height="150"></canvas>
                  </div>
                  <bitmap-text .fontRenderer=${this.fontRenderer} text="Previewing:" scale="1.5" color="#aaa"></bitmap-text>
                  <div class="preview-label">
                      <bitmap-text .fontRenderer=${this.fontRenderer} text=${previewName} scale="1.5"></bitmap-text>
                  </div>
              </div>

              <div class="right-panel">
                  <div class="tabs">
                      <button class="tab-button ${this.activeTab === 'dash' ? 'active' : ''}" @click=${() => { this.activeTab = 'dash'; eventBus.publish('playSound', {key:'button_click', volume:0.5, channel:'UI'}); }}>
                          <bitmap-text .fontRenderer=${this.fontRenderer} text="Dash Trails" scale="1.5"></bitmap-text>
                      </button>
                      <button class="tab-button ${this.activeTab === 'death' ? 'active' : ''}" @click=${() => { this.activeTab = 'death'; eventBus.publish('playSound', {key:'button_click', volume:0.5, channel:'UI'}); }}>
                          <bitmap-text .fontRenderer=${this.fontRenderer} text="Death Anims" scale="1.5"></bitmap-text>
                      </button>
                      <button class="tab-button ${this.activeTab === 'aura' ? 'active' : ''}" @click=${() => { this.activeTab = 'aura'; eventBus.publish('playSound', {key:'button_click', volume:0.5, channel:'UI'}); }}>
                          <bitmap-text .fontRenderer=${this.fontRenderer} text="Auras" scale="1.5"></bitmap-text>
                      </button>
                      <button class="tab-button ${this.activeTab === 'mutator' ? 'active' : ''}" @click=${() => { this.activeTab = 'mutator'; eventBus.publish('playSound', {key:'button_click', volume:0.5, channel:'UI'}); }}>
                          <bitmap-text .fontRenderer=${this.fontRenderer} text="Mutators" scale="1.5"></bitmap-text>
                      </button>
                  </div>

                  <div class="items-grid">
                    ${map(items, item => {
                        const isUnlocked = this.gameState.unlockedCosmetics.includes(item.id);
                        const isEquipped = equippedId === item.id;
                        const canAfford = this.gameState.fruitCoins >= item.cost;
                        
                        let btnClass = 'purchase';
                        let btnText = `${item.cost} Coins`;
                        
                        if (isEquipped) { btnClass = 'equipped'; btnText = 'Equipped'; }
                        else if (isUnlocked) { btnClass = 'equip'; btnText = 'Equip'; }

                        return html`
                            <div class="shop-item ${isEquipped ? 'equipped' : ''}" @mouseenter=${() => this._setPreviewItem(item.id)}>
                                <div class="item-name">
                                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${item.name} scale="1.5"></bitmap-text>
                                </div>
                                <button 
                                    class="buy-button ${btnClass}" 
                                    ?disabled=${(!isUnlocked && !canAfford) || isEquipped}
                                    @click=${() => this._handleAction(item, this.activeTab)}
                                >
                                    ${(!isUnlocked) ? html`
                                        <animated-sprite-card bare scaleToFit style="width:20px; height:20px;" .sprite=${this.assets?.coin_icon} .frameCount=${14} .frameSpeed=${0.05}></animated-sprite-card>
                                    ` : ''}
                                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${btnText} scale="1.5"></bitmap-text>
                                </button>
                            </div>
                        `;
                    })}
                  </div>
              </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('shop-modal', ShopModal);