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

    .item-name { margin-bottom: 10px; }
    
    .preview-box {
        width: 64px; height: 64px; background-color: #2a2a2a; border-radius: 8px;
        display: flex; justify-content: center; align-items: center;
        margin-bottom: auto; position: relative; overflow: hidden;
    }
    
    /* Particle/Effect Previews */
    .preview-player {
        width: 32px; height: 32px; z-index: 2; position: relative;
    }
    
    /* Dash Previews */
    .preview-dash-default {
        position: absolute; width: 8px; height: 8px; background: white; opacity: 0.7;
        border-radius: 50%; right: 25px;
        box-shadow: -10px 5px 0 2px rgba(255,255,255,0.4), -20px -2px 0 -1px rgba(255,255,255,0.2);
    }
    .preview-dash-phantom {
        position: absolute; width: 32px; height: 32px; opacity: 0.4;
        filter: sepia(1) hue-rotate(240deg) saturate(3); right: 20px;
    }
    .preview-dash-rainbow {
        position: absolute; width: 12px; height: 12px; border-radius: 50%; right: 30px;
        animation: rainbow-anim 2s linear infinite;
        box-shadow: -15px 5px 0 2px rgba(255,255,255,0.4);
    }
    @keyframes rainbow-anim {
        0% { background: red; } 33% { background: lime; } 66% { background: blue; } 100% { background: red; }
    }
    .preview-dash-pixel {
        position: absolute; width: 10px; height: 10px; background: cyan; right: 25px;
        box-shadow: -15px -5px 0 magenta, -5px 10px 0 yellow;
    }

    /* Death Previews */
    .preview-death-default {
        position: absolute; width: 8px; height: 8px; background: white; border-radius: 50%;
        box-shadow: 15px -15px 0 white, -15px 15px 0 white, 15px 15px 0 white, -15px -15px 0 white;
    }
    .preview-death-shatter {
        position: absolute; width: 8px; height: 8px; background: red;
        box-shadow: 20px -10px 0 lime, -15px 20px 0 blue, 10px 15px 0 yellow, -10px -20px 0 cyan;
    }
    .preview-death-glitch {
        position: absolute; width: 12px; height: 12px; background: magenta;
        box-shadow: 10px -5px 0 cyan, -10px 5px 0 yellow, 5px 10px 0 red, -5px -10px 0 blue;
        animation: glitch-anim 0.2s steps(2, end) infinite;
    }
    @keyframes glitch-anim {
        0% { transform: translate(2px, -2px); } 50% { transform: translate(-2px, 2px); } 100% { transform: translate(2px, -2px); }
    }
    .preview-death-implosion {
        position: absolute; width: 100%; height: 100%; border-radius: 50%;
        box-shadow: inset 0 0 20px purple; animation: implode-anim 1.5s infinite;
    }
    @keyframes implode-anim {
        0% { transform: scale(1.5); opacity: 0; } 50% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(0); opacity: 0; }
    }

    /* Aura Previews */
    .preview-aura-supercharge {
        position: absolute; width: 40px; height: 40px; border-radius: 50%;
        box-shadow: 0 0 15px 5px rgba(255, 204, 25, 0.6);
        animation: pulse-anim 1s infinite alternate;
    }
    .preview-aura-shadow {
        position: absolute; width: 40px; height: 40px; border-radius: 50%;
        box-shadow: 0 0 20px 10px rgba(25, 0, 51, 0.8);
    }
    .preview-aura-orbiting {
        position: absolute; width: 40px; height: 40px; border-radius: 50%;
        animation: orbit-anim 2s linear infinite;
        border: 2px solid transparent;
    }
    .preview-aura-orbiting::before, .preview-aura-orbiting::after {
        content: ''; position: absolute; width: 8px; height: 8px; background: cyan; border-radius: 50%;
        top: 14px;
    }
    .preview-aura-orbiting::before { left: -6px; }
    .preview-aura-orbiting::after { right: -6px; }
    @keyframes orbit-anim {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    @keyframes pulse-anim {
        0% { transform: scale(0.9); opacity: 0.7; }
        100% { transform: scale(1.1); opacity: 1; }
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

                let previewHtml = '';
                const playerSprite = this.assets?.characters[this.gameState.selectedCharacter]?.playerIdle;
                const dashSprite = this.assets?.characters[this.gameState.selectedCharacter]?.playerDash;
                
                if (this.activeTab === 'dash') {
                    const spriteToUse = dashSprite || playerSprite;
                    let extraElement = '';
                    if (item.id === 'default_dash') extraElement = html`<div class="preview-dash-default"></div>`;
                    else if (item.id === 'phantom_dash') extraElement = html`<div class="preview-dash-phantom" style="background-image: url(${spriteToUse?.src}); background-position: left; object-fit: none;"></div>`;
                    else if (item.id === 'rainbow_dash') extraElement = html`<div class="preview-dash-rainbow"></div>`;
                    else if (item.id === 'pixel_dash') extraElement = html`<div class="preview-dash-pixel"></div>`;
                    
                    previewHtml = html`
                        <div class="preview-box">
                            <img class="preview-player" src=${spriteToUse?.src} style="image-rendering: pixelated; object-fit: none; object-position: left;" />
                            ${extraElement}
                        </div>
                    `;
                } else if (this.activeTab === 'death') {
                    let extraElement = '';
                    if (item.id === 'default_death') extraElement = html`<div class="preview-death-default"></div>`;
                    else if (item.id === 'shatter_death') extraElement = html`<div class="preview-death-shatter"></div>`;
                    else if (item.id === 'glitch_death') extraElement = html`<div class="preview-death-glitch"></div>`;
                    else if (item.id === 'implosion_death') extraElement = html`<div class="preview-death-implosion"></div>`;
                    
                    previewHtml = html`
                        <div class="preview-box">
                            ${extraElement}
                        </div>
                    `;
                } else if (this.activeTab === 'aura') {
                    let extraElement = '';
                    if (item.id === 'supercharge_aura') extraElement = html`<div class="preview-aura-supercharge"></div>`;
                    else if (item.id === 'shadow_aura') extraElement = html`<div class="preview-aura-shadow"></div>`;
                    else if (item.id === 'orbiting_aura') extraElement = html`<div class="preview-aura-orbiting"></div>`;
                    
                    previewHtml = html`
                        <div class="preview-box">
                            <img class="preview-player" src=${playerSprite?.src} style="image-rendering: pixelated; object-fit: none; object-position: left;" />
                            ${extraElement}
                        </div>
                    `;
                }

                return html`
                    <div class="shop-item ${isEquipped ? 'equipped' : ''}">
                        <div class="item-name">
                            <bitmap-text .fontRenderer=${this.fontRenderer} text=${item.name} scale="1.5"></bitmap-text>
                        </div>
                        
                        ${previewHtml}

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