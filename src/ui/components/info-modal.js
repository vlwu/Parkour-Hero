import { LitElement, html, css } from 'lit';
import { formatKeyForDisplay } from '../ui-utils.js';

export class InfoModal extends LitElement {
  static styles = css`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
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
      max-width: 600px; max-height: 80vh; overflow-y: auto;
    }
    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('/assets/Menu/Buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer; border-radius: 50%;
      transition: transform 0.2s ease-in-out;
    }
    .close-button:hover { transform: scale(1.1); }
    h2 { margin: 0 0 10px 0; font-size: 2.2em; }
    h3 { margin: 0 0 20px 0; font-size: 1.5em; border-bottom: 2px solid #666; padding-bottom: 10px; }
    .settings-section { padding: 20px; background-color: #444; border-radius: 8px; border: 1px solid #555; }
    .how-to-play p { line-height: 1.6; margin-bottom: 20px; text-align: left; }
    .keybind-list { display: flex; flex-direction: column; gap: 15px; }
    .keybind-item {
        display: flex; justify-content: space-between; align-items: center;
        background-color: #555; padding: 12px 15px; border-radius: 8px;
    }
    .keybind-item label { text-align: left; flex-grow: 1; }
    .key-display-container { display: flex; gap: 5px; align-items: center; }
    .key-display {
      background-color: #666; color: #fff; border: 1px solid #777;
      padding: 5px 10px; border-radius: 6px; text-align: center;
      font-weight: bold; min-width: 20px;
    }
  `;

  static properties = {
    keybinds: { type: Object },
  };

  _dispatchClose() {
    this.dispatchEvent(new CustomEvent('close-modal', { bubbles: true, composed: true }));
  }

  render() {
    if (!this.keybinds) return html``;

    return html`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e => e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          <h2>Info Section</h2>
          <div class="settings-section">
            <h3>How to Play</h3>
            <div class="how-to-play">
              <p>Use the controls to navigate the world, collect all the fruit, and reach the trophy!</p>
              <p>You can also jump off of most walls! While in the air, move against a wall to slide down it, then press the jump key again to wall jump away.</p>
              <p><strong>Note:</strong> You cannot cling to natural surfaces like dirt, sand, mud, or ice.</p>
              <div class="keybind-list">
                <div class="keybind-item">
                  <label>Move Left / Right:</label>
                  <div class="key-display-container">
                    <span class="key-display">${formatKeyForDisplay(this.keybinds.moveLeft)}</span>
                    <span>/</span>
                    <span class="key-display">${formatKeyForDisplay(this.keybinds.moveRight)}</span>
                  </div>
                </div>
                <div class="keybind-item">
                  <label>Jump / Double Jump / Wall Jump:</label>
                  <span class="key-display">${formatKeyForDisplay(this.keybinds.jump)}</span>
                </div>
                <div class="keybind-item">
                  <label>Dash:</label>
                  <span class="key-display">${formatKeyForDisplay(this.keybinds.dash)}</span>
                </div>
                <div class="keybind-item">
                  <label>Pause Game:</label>
                  <span class="key-display">ESC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('info-modal', InfoModal);