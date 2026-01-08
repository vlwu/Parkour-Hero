import { LitElement, html, css } from 'lit';
import { characterConfig } from '../../entities/level-definitions.js';
import { eventBus } from '../../utils/event-bus.js';
import './bitmap-text.js';
import './character-card.js';

export class CharacterUnlockModal extends LitElement {
  static styles = css`
    .modal-overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex; justify-content: center; align-items: center; z-index: 400;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7); color: #eee;
      text-align: center; width: 90%; max-width: 450px;
      display: flex; flex-direction: column; align-items: center;
      border: 2px solid #FFD700; /* Gold border for unlock */
    }
    .title-container { margin-bottom: 20px; }
    .card-container {
        width: 100%;
        margin-bottom: 20px;
    }
    .footer-actions {
        display: flex; gap: 15px; width: 100%; justify-content: center;
    }
    .action-button {
      background-color: #007bff; color: #fff; border: 2px solid #0056b3;
      padding: 10px 20px; border-radius: 8px; cursor: pointer;
      font-size: 1.2em; font-weight: bold;
      transition: all 0.2s ease-in-out;
    }
    .action-button:hover { background-color: #0056b3; }
    
    .equip-button {
        background-color: #4CAF50; border-color: #45a049;
    }
    .equip-button:hover { background-color: #45a049; }
  `;

  static properties = {
    characterId: { type: String },
    assets: { type: Object },
    fontRenderer: { type: Object },
  };

  _handleEquip() {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
      eventBus.publish('characterUpdated', this.characterId);
      this._handleClose();
  }

  _handleClose() {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
      this.dispatchEvent(new CustomEvent('close-modal', { bubbles: true, composed: true }));
  }

  render() {
    if (!this.characterId || !this.assets || !this.fontRenderer) return html``;

    const charSprite = this.assets.characters[this.characterId]?.playerIdle;

    return html`
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="New Hero Unlocked!" scale="3" color="#FFD700" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          
          <div class="card-container">
             <character-card
                .characterId=${this.characterId}
                .idleSprite=${charSprite}
                .isLocked=${false}
                .isSelected=${false}
                .fontRenderer=${this.fontRenderer}
             ></character-card>
          </div>

          <div class="footer-actions">
            <button class="action-button equip-button" @click=${this._handleEquip}>Equip</button>
            <button class="action-button" @click=${this._handleClose}>Close</button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('character-unlock-modal', CharacterUnlockModal);