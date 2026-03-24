import { LitElement, html, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { characterConfig } from '../../entities/level-definitions.js';
import { eventBus } from '../../utils/event-bus.js';
import './character-card.js';
import './bitmap-text.js';

export class CharacterMenu extends LitElement {
  static styles = css`
    .modal-overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center;
      z-index: 200;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); color: #eee;
      text-align: center; position: relative; width: 90%;

      max-width: 800px;
      max-height: 80vh; overflow-y: auto;
      box-sizing: border-box;
    }
    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('/assets/Menu/Buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer;
      transition: transform 0.2s ease-in-out;
    }
    .close-button:hover { transform: scale(1.1); }
    .title-container, .subtitle-container {
        display: flex;
        justify-content: center;
        margin-bottom: 10px;
    }
    .subtitle-container {
        margin-bottom: 25px;
    }
    .shop-button {
      background-color: #f39c12; color: #fff; border: 2px solid #e67e22;
      padding: 10px 20px; border-radius: 8px; cursor: pointer;
      display: flex; justify-content: center; align-items: center;
      transition: all 0.2s ease-in-out;
      margin: 0 auto 20px auto;
    }
    .shop-button:hover {
      background-color: #e67e22; transform: scale(1.05);
    }

    #character-selection-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      padding: 10px;
      grid-auto-rows: 1fr;
    }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #2a2a2a; border-radius: 4px; }
    ::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #777; }
  `;

  static properties = {
      gameState: { type: Object },
      assets: { type: Object },
      fontRenderer: { type: Object },
  };

  _dispatchClose() {
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
    this.dispatchEvent(new CustomEvent('close-modal', { bubbles: true, composed: true }));
  }
  
  _openShop() {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
      this.dispatchEvent(new CustomEvent('open-modal', { detail: { modal: 'shop' }, bubbles: true, composed: true }));
  }

  render() {
    if (!this.gameState || !this.assets) {
        return html`<div class="modal-overlay">Loading...</div>`;
    }

    const characterIds = Object.keys(characterConfig);

    return html`
        <div class="modal-overlay" @click=${this._dispatchClose}>
            <div class="modal-content" @click=${e => e.stopPropagation()}>
                <button class="close-button" @click=${this._dispatchClose}></button>
                <div class="title-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Character Selection" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
                </div>
                <div class="subtitle-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Choose Your Hero!" scale="2"></bitmap-text>
                </div>
                
                <div style="display:flex; justify-content:center;">
                    <button class="shop-button" @click=${this._openShop}>
                        <bitmap-text .fontRenderer=${this.fontRenderer} text="Cosmetics Shop" scale="1.5"></bitmap-text>
                    </button>
                </div>

                <div id="character-selection-container">
                    ${map(characterIds, (id) => html`
                        <character-card
                            .characterId=${id}
                            .idleSprite=${this.assets.characters[id]?.playerIdle}
                            .isLocked=${!this.gameState.isCharacterUnlocked(id)}
                            .isSelected=${this.gameState.selectedCharacter === id}
                            .fontRenderer=${this.fontRenderer}
                        ></character-card>
                    `)}
                </div>
            </div>
        </div>
    `;
  }
}

customElements.define('character-menu', CharacterMenu);