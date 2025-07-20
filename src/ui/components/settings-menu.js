import { LitElement, html, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { eventBus } from '../../utils/event-bus.js';
import './keybind-display.js';

export class SettingsMenu extends LitElement {
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
    h2 { margin: 0 0 25px 0; font-size: 2.2em; }
    h3 { margin: 0 0 20px 0; font-size: 1.5em; border-bottom: 2px solid #666; padding-bottom: 10px; }
    .settings-section { margin-bottom: 30px; padding: 20px; background-color: #444; border-radius: 8px; border: 1px solid #555; }
    .setting-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 10px; background-color: #555; border-radius: 6px; }
    .setting-item label { flex-grow: 1; text-align: left; }
    .toggle-button { border: 2px solid #777; padding: 8px 16px; border-radius: 6px; cursor: pointer; min-width: 60px; transition: all 0.2s ease-in-out; }
    .toggle-button.sound-enabled { background-color: #4CAF50; border-color: #45a049; }
    .toggle-button.sound-disabled { background-color: #f44336; border-color: #d32f2f; }
    .volume-control { display: flex; align-items: center; gap: 10px; }
    .action-button { background-color: #007bff; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 1em; }
    .action-button:hover { background-color: #0056b3; }
    .keybind-list { display: flex; flex-direction: column; gap: 15px; }
    .keybind-item { display: flex; justify-content: space-between; align-items: center; background-color: #555; padding: 12px 15px; border-radius: 8px; }
    .keybind-item label { margin-right: 15px; flex-grow: 1; text-align: left; }
  `;

  static properties = {
    keybinds: { type: Object },
    soundSettings: { type: Object },
  };

  _dispatchClose() {
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
    this.dispatchEvent(new CustomEvent('close-modal', { bubbles: true, composed: true }));
  }

  _toggleSound() {
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
    eventBus.publish('toggleSound');
  }

  _setVolume(e) {
    const volume = parseFloat(e.target.value);
    eventBus.publish('setSoundVolume', { volume });
  }

  _testSound() {
    eventBus.publish('playSound', { key: 'jump', volume: 0.8, channel: 'UI' });
  }

  render() {
    if (!this.keybinds || !this.soundSettings) {
      return html``;
    }
    const keybindActions = Object.keys(this.keybinds);

    return html`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e => e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          <h2>Game Settings</h2>

          <div class="settings-section">
            <h3>Sound Settings</h3>
            <div class="setting-item">
              <label>Sound:</label>
              <button @click=${this._toggleSound} class="toggle-button ${this.soundSettings.soundEnabled ? 'sound-enabled' : 'sound-disabled'}">
                ${this.soundSettings.soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div class="setting-item">
              <label>Global Volume:</label>
              <div class="volume-control">
                <input type="range" min="0" max="1" step="0.1" .value=${this.soundSettings.soundVolume} @input=${this._setVolume} />
                <span>${Math.round(this.soundSettings.soundVolume * 100)}%</span>
              </div>
            </div>
             <div class="setting-item">
                <button @click=${this._testSound} class="action-button" ?disabled=${!this.soundSettings.soundEnabled}>Test Sound</button>
             </div>
          </div>

          <div class="settings-section">
            <h3>Keybind Settings</h3>
            <div class="keybind-list">
              ${map(keybindActions, (action) => html`
                <div class="keybind-item">
                  <label>${action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</label>
                  <keybind-display
                    .action=${action}
                    .currentKey=${this.keybinds[action]}
                  ></keybind-display>
                </div>
              `)}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('settings-menu', SettingsMenu);