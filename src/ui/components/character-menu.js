import { LitElement, html, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { characterConfig } from '../../entities/level-definitions.js';
import './character-card.js';
import './bitmap-text.js';

export class CharacterMenu extends LitElement {
  static styles = css`
    .modal-overlay {
      position: fixed; inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center;
      z-index: 200;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); color: #eee;
      text-align: center; position: relative; width: 90%;
      /* Increase max-width to better accommodate wider cards on larger screens */
      max-width: 800px; 
      max-height: 80vh; overflow-y: auto;
      box-sizing: border-box; 
    }
    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('/assets/Menu/Buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer; border-radius: 50%;
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
    
    #character-selection-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 20px;
      padding: 10px;
      grid-auto-rows: 1fr;
    }
  `;
  
  static properties = {
      gameState: { type: Object },
      assets: { type: Object },
      fontRenderer: { type: Object },
  };
  
  _dispatchClose() {
    this.dispatchEvent(new CustomEvent('close-modal', { bubbles: true, composed: true }));
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