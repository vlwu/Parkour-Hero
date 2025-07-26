import { LitElement, html, css } from 'lit';
import { eventBus } from '../../utils/event-bus.js';
import { formatKeyForDisplay } from '../ui-utils.js';
import './bitmap-text.js';

export class TutorialModal extends LitElement {
  static styles = css`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: absolute; inset: 0; background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center; z-index: 400;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); color: #eee;
      text-align: center; position: relative; width: 90%; max-width: 700px;
      max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; gap: 20px;
    }
    .title-container, .section-title-container {
      display: flex; justify-content: center;
    }
    .section {
      background-color: #444; border-radius: 8px; border: 1px solid #555;
      padding: 15px; text-align: left; display: flex; flex-direction: column; gap: 15px;
    }
    p { margin: 0; line-height: 1.6; }
    .controls-grid {
      display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; align-items: center;
    }
    .key-display {
      background-color: #666; color: #fff; border: 1px solid #777;
      border-radius: 6px; text-align: center;
      min-width: 20px; display: inline-flex; justify-content: center;
      align-items: center; padding: 5px 8px;
    }
    .action-button {
      background-color: #007bff; color: #fff; border: 2px solid #0056b3;
      padding: 10px 20px; border-radius: 8px; cursor: pointer;
      display: flex; justify-content: center; align-items: center;
      transition: all 0.2s ease-in-out; margin-top: 10px;
    }
    .action-button:hover { background-color: #0056b3; }
  `;

  static properties = {
    keybinds: { type: Object },
    fontRenderer: { type: Object },
  };

  _dispatchClose() {
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
    this.dispatchEvent(new CustomEvent('close-modal', { bubbles: true, composed: true }));
  }

  render() {
    if (!this.keybinds || !this.fontRenderer) return html``;

    return html`
      <div class="modal-overlay">
        <div class="modal-content" @click=${e => e.stopPropagation()}>
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Welcome to Parkour Hero!" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>

          <div class="section">
            <div class="section-title-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="The Goal" scale="2.2"></bitmap-text>
            </div>
            <p>Your mission is to collect all the fruit to unlock the trophy, then reach it to complete the level!</p>
          </div>

          <div class="section">
            <div class="section-title-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Basic Controls" scale="2.2"></bitmap-text>
            </div>
            <div class="controls-grid">
                <span>Move Left / Right</span>
                <div style="display: flex; gap: 5px;">
                    <div class="key-display"><bitmap-text .fontRenderer=${this.fontRenderer} text=${formatKeyForDisplay(this.keybinds.moveLeft)} scale="1.5"></bitmap-text></div>
                    <div class="key-display"><bitmap-text .fontRenderer=${this.fontRenderer} text=${formatKeyForDisplay(this.keybinds.moveRight)} scale="1.5"></bitmap-text></div>
                </div>
                <span>Jump</span>
                <div class="key-display"><bitmap-text .fontRenderer=${this.fontRenderer} text=${formatKeyForDisplay(this.keybinds.jump)} scale="1.5"></bitmap-text></div>
                <span>Dash</span>
                <div class="key-display"><bitmap-text .fontRenderer=${this.fontRenderer} text=${formatKeyForDisplay(this.keybinds.dash)} scale="1.5"></bitmap-text></div>
            </div>
             <p><strong>Advanced Moves:</strong> Press Jump in the air for a <strong>Double Jump</strong>. Move into a wall while falling to slide, then press Jump for a <strong>Wall Jump</strong>!</p>
          </div>

          <div class="section">
            <div class="section-title-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Enemies & Environment" scale="2.2"></bitmap-text>
            </div>
            <p>This world is full of critters! Most can be defeated by jumping on their heads. Bumping into them from the side is a bad idea. Some foes are trickier than they look!</p>
            <p>Also, be sure to avoid dangerous traps as you traverse each section! Luckily, fruits do heal you from most damage.</p>
          </div>

          <div class="section">
            <div class="section-title-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Interface" scale="2.2"></bitmap-text>
            </div>
            <p>The buttons in the top-right corner allow you to change settings, pause the game, select levels, and more at any time.</p>
          </div>

          <button class="action-button" @click=${this._dispatchClose}>
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Got It!" scale="2"></bitmap-text>
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define('tutorial-modal', TutorialModal);