import { LitElement, html, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { eventBus } from '../../utils/event-bus.js';
import { COSMETICS } from '../../utils/constants.js';
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
      max-width: 800px; max-height: 85vh; display: flex; flex-direction: column;
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
        margin-bottom: 20px; border-bottom: 2px solid #555; padding-bottom: 15px;
    }
    .coin-display {
        display: flex; align-items: center; gap: 10px;
        background: rgba(0,0,0,0.4); padding: 8px 15px; border-radius: 20px;
        border: 2px solid #f1c40f;
    }

    .tabs {
        display: flex; gap: 10px; justify-content: center; margin-bottom: 20px;
    }
    .tab-button {
        background-color: #444; border: 2px solid #666; color: white;
        padding: 10px 20px; border-radius: 8px; cursor: pointer;
        transition: all 0.2s; flex: 1; max-width: 200px;
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
        transition: transform 0.2s, border-color 0.2s;
    }
    .shop-item.equipped { border-color: #4CAF50; background-color: #3d4a3e; }
    .shop-item:hover { transform: translateY(-3px); }

    .item-name { margin-bottom: auto; }
    
    .preview-canvas {
        background-color: #222;
        border-radius: 4px;
        margin-bottom: 5px;
        border: 1px solid #555;
    }
    
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
    activeTab: { type: String, state: true }
  };

  constructor() {
    super();
    this.activeTab = 'dash';
  }

  connectedCallback() {
      super.connectedCallback();
      this.previewParticles = {};
      this.lastTime = performance.now();
      this.animFrame = requestAnimationFrame(this._animatePreviews);
  }

  disconnectedCallback() {
      super.disconnectedCallback();
      cancelAnimationFrame(this.animFrame);
  }
  
  _animatePreviews = (time) => {
      this.animFrame = requestAnimationFrame(this._animatePreviews);
      const dt = (time - this.lastTime) / 1000;
      this.lastTime = time;

      const canvases = this.shadowRoot.querySelectorAll('.preview-canvas');
      canvases.forEach(canvas => {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const itemId = canvas.dataset.id;
          const category = canvas.dataset.category;
          
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;

          ctx.fillStyle = '#ff8c21';
          ctx.fillRect(cx - 10, cy - 10, 20, 20);

          if (!this.previewParticles[itemId]) {
              this.previewParticles[itemId] = [];
          }
          let particles = this.previewParticles[itemId];
          
          if (category === 'dash') {
              if (Math.random() < 0.5) {
                  this._emitShopParticle(particles, itemId, category, cx, cy);
              }
          } else if (category === 'aura') {
              if (Math.random() < 0.2) {
                  this._emitShopParticle(particles, itemId, category, cx, cy);
              }
          } else if (category === 'death') {
              if (!this.burstTimers) this.burstTimers = {};
              if ((this.burstTimers[itemId] || 0) <= 0) {
                  this.burstTimers[itemId] = 2.0;
                  ctx.clearRect(0,0,canvas.width,canvas.height);
                  for (let i = 0; i < 20; i++) this._emitShopParticle(particles, itemId, category, cx, cy);
              }
              this.burstTimers[itemId] -= dt;
              if (this.burstTimers[itemId] > 1.8) {
                  ctx.clearRect(0,0,canvas.width,canvas.height);
              }
          }

          for (let i = particles.length - 1; i >= 0; i--) {
              let p = particles[i];
              p.life -= dt;
              if (p.life <= 0) {
                  particles.splice(i, 1);
              } else {
                  p.x += p.vx * dt;
                  p.y += p.vy * dt;
                  p.vy += p.gravity * dt;
                  ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
                  ctx.fillStyle = p.color;
                  ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
              }
          }
          ctx.globalAlpha = 1.0;
      });
  }

  _emitShopParticle(particles, id, category, cx, cy) {
      let p = { x: cx, y: cy, vx: 0, vy: 0, gravity: 0, life: 0.5, maxLife: 0.5, size: 6, color: 'white' };
      
      if (category === 'dash') {
          p.vx = -50 - Math.random()*50;
          p.vy = (Math.random() - 0.5) * 20;
          p.gravity = 50;
          if (id === 'phantom_dash') { p.color = 'rgba(150, 50, 255, 0.8)'; p.gravity = -10; p.vx = -20; p.size = 12; }
          else if (id === 'rainbow_dash') { p.color = `hsl(${Math.random()*360}, 100%, 50%)`; p.vy = (Math.random()-0.5)*50; }
          else if (id === 'pixel_dash') { p.color = ['red','green','blue','yellow','cyan','magenta'][Math.floor(Math.random()*6)]; p.size = 8; p.vx = -30; p.gravity = 0; }
      } else if (category === 'death') {
          const angle = Math.random() * Math.PI * 2;
          const speed = 50 + Math.random() * 50;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
          p.gravity = 150;
          if (id === 'shatter_death') { p.color = ['#ff3333','#33ff33','#3333ff'][Math.floor(Math.random()*3)]; p.vy -= 50; p.gravity = 300; }
          else if (id === 'glitch_death') { p.color = ['red','green','blue','yellow','cyan','magenta'][Math.floor(Math.random()*6)]; p.gravity = 0; }
          else if (id === 'implosion_death') { p.x += p.vx; p.y += p.vy; p.vx = -p.vx; p.vy = -p.vy; p.color = 'purple'; p.gravity = 0; }
      } else if (category === 'aura') {
          if (id === 'supercharge_aura') { p.color = 'rgba(255, 200, 50, 0.8)'; p.vy = -30; p.gravity = -50; p.size = 8; p.x += (Math.random()-0.5)*20; }
          else if (id === 'shadow_aura') { p.color = 'rgba(20, 0, 50, 0.6)'; p.y += 10; p.vx = (Math.random()-0.5)*10; p.gravity = -5; p.size = 12; p.maxLife = 0.8; p.life = 0.8; }
          else if (id === 'orbiting_aura') { 
              const time = performance.now() / 300;
              const angle = time + (Math.random() > 0.5 ? Math.PI : 0);
              const z = Math.sin(angle);
              p.x = cx + Math.cos(angle) * 15;
              p.y = cy + Math.sin(angle) * 5;
              p.color = 'cyan'; p.life = 0.1; p.maxLife = 0.1; p.size = 6 * (1 + z * 0.5);
          }
      }
      particles.push(p);
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
                    <div class="shop-item ${isEquipped ? 'equipped' : ''}">
                        <div class="item-name">
                            <bitmap-text .fontRenderer=${this.fontRenderer} text=${item.name} scale="1.5"></bitmap-text>
                        </div>
                        
                        <canvas class="preview-canvas" width="160" height="80" data-id=${item.id} data-category=${this.activeTab}></canvas>

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
    `;
  }
}

customElements.define('shop-modal', ShopModal);