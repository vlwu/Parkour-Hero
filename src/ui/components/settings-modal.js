import { LitElement, html, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { eventBus } from '../../utils/event-bus.js';
import './keybind-display.js';
import './bitmap-text.js';

export class SettingsMenu extends LitElement {
  static styles = css`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
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
      max-width: 600px; max-height: 80vh; overflow-y: auto;
    }
    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('/assets/Menu/Buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer;
      transition: transform 0.2s ease-in-out;
    }
    .close-button:hover { transform: scale(1.1); }
    .close-button:disabled { opacity: 0.5; cursor: not-allowed; }
    .close-button:disabled:hover { transform: none; }

    .title-container {
        display: flex;
        justify-content: center;
        margin-bottom: 25px;
    }
    .section-title-container {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #666;
        padding-bottom: 10px;
    }

    .settings-section { margin-bottom: 30px; padding: 20px; background-color: #444; border-radius: 8px; border: 1px solid #555; }
    .setting-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 10px; background-color: #555; border-radius: 6px; }
    .setting-item .label-container { flex-grow: 1; text-align: left; }

    .toggle-button {
        border: 2px solid #777; padding: 8px 16px; border-radius: 6px; cursor: pointer;
        min-width: 70px; transition: all 0.2s ease-in-out;
        display: flex; justify-content: center; align-items: center;
    }
    .toggle-button.sound-enabled { background-color: #4CAF50; border-color: #45a049; }
    .toggle-button.sound-disabled { background-color: #f44336; border-color: #d32f2f; }

    .volume-control { display: flex; align-items: center; gap: 10px; }

    /* Custom Range Input Styles */
    input[type=range] {
      -webkit-appearance: none;
      width: 100%;
      background: transparent;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 16px;
      width: 16px;
      border-radius: 50%;
      cursor: pointer;
      margin-top: -6px;
    }
    input[type=range]::-moz-range-thumb {
      height: 16px;
      width: 16px;
      border-radius: 50%;
      cursor: pointer;
      border: none;
    }
    input[type=range]::-webkit-slider-runnable-track {
      width: 100%;
      height: 4px;
      cursor: pointer;
      background: #666;
      border-radius: 2px;
    }
    input[type=range]::-moz-range-track {
      width: 100%;
      height: 4px;
      cursor: pointer;
      background: #666;
      border-radius: 2px;
    }

    /* Volume Slider Colors */
    input[type="range"].volume-enabled::-webkit-slider-thumb { background: #4CAF50; }
    input[type="range"].volume-enabled::-moz-range-thumb { background: #4CAF50; }
    
    input[type="range"].volume-disabled::-webkit-slider-thumb { background: #f44336; }
    input[type="range"].volume-disabled::-moz-range-thumb { background: #f44336; }

    /* Minimap Slider Colors */
    input[type="range"].minimap-slider::-webkit-slider-thumb { background: #3498db; }
    input[type="range"].minimap-slider::-moz-range-thumb { background: #3498db; }

    .action-button {
        background-color: #007bff; color: #fff; border: none; padding: 10px 20px;
        border-radius: 6px; cursor: pointer;
        display: flex; justify-content: center; align-items: center;
    }
    .action-button:hover:not(:disabled) { background-color: #0056b3; }
    .action-button:disabled { background-color: #666; cursor: not-allowed; opacity: 0.7; }

    .keybind-list { display: flex; flex-direction: column; gap: 15px; }
    .keybind-item { display: flex; justify-content: space-between; align-items: center; background-color: #555; padding: 12px 15px; border-radius: 8px; }
    .keybind-item .label-container { margin-right: 15px; flex-grow: 1; text-align: left; }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #2a2a2a; border-radius: 4px; }
    ::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #777; }
  `;

  static properties = {
    keybinds: { type: Object },
    soundSettings: { type: Object },
    gameplaySettings: { type: Object },
    fontRenderer: { type: Object },
  };

  _getDuplicateKeys() {
      if (!this.keybinds) return new Set();
      const keys = Object.values(this.keybinds);
      const duplicates = new Set();
      const seen = new Set();
      for (const key of keys) {
          if (seen.has(key)) {
              duplicates.add(key);
          }
          seen.add(key);
      }
      return duplicates;
  }

  _hasDuplicates() {
      return this._getDuplicateKeys().size > 0;
  }

  _dispatchClose() {
    if (this._hasDuplicates()) return;
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

  _setMinimapSize(e) {
    const size = parseFloat(e.target.value);
    eventBus.publish('setMinimapSize', { size });
  }

  _testSound() {
    eventBus.publish('playSound', { key: 'jump', volume: 0.8, channel: 'UI' });
  }

  render() {
    if (!this.keybinds || !this.soundSettings || !this.fontRenderer || !this.gameplaySettings) {
      return html``;
    }
    const keybindActions = Object.keys(this.keybinds);
    const volumeClass = this.soundSettings.enabled ? 'volume-enabled' : 'volume-disabled';
    const duplicates = this._getDuplicateKeys();

    return html`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e => e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose} ?disabled=${this._hasDuplicates()}></button>

          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Game Settings" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>

          <div class="settings-section">
            <div class="section-title-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Sound Settings" scale="2.2"></bitmap-text>
            </div>

            <div class="setting-item">
              <div class="label-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Sound:" scale="1.8"></bitmap-text>
              </div>
              <button @click=${this._toggleSound} class="toggle-button ${this.soundSettings.enabled ? 'sound-enabled' : 'sound-disabled'}">
                <bitmap-text .fontRenderer=${this.fontRenderer} text=${this.soundSettings.enabled ? 'ON' : 'OFF'} scale="1.8"></bitmap-text>
              </button>
            </div>
            <div class="setting-item">
              <div class="label-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Global Volume:" scale="1.8"></bitmap-text>
              </div>
              <div class="volume-control">
                <input 
                  type="range" 
                  class="${volumeClass}"
                  min="0" 
                  max="1" 
                  step="0.1" 
                  .value=${this.soundSettings.volume} 
                  @input=${this._setVolume} 
                />
                <bitmap-text .fontRenderer=${this.fontRenderer} text=${`${Math.round(this.soundSettings.volume * 100)}%`} scale="1.8"></bitmap-text>
              </div>
            </div>
             <div class="setting-item">
                <button @click=${this._testSound} class="action-button" ?disabled=${!this.soundSettings.enabled}>
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Test Sound" scale="1.8"></bitmap-text>
                </button>
             </div>
          </div>

          <div class="settings-section">
            <div class="section-title-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Gameplay Settings" scale="2.2"></bitmap-text>
            </div>
            <div class="setting-item">
              <div class="label-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Minimap Size:" scale="1.8"></bitmap-text>
              </div>
              <div class="volume-control">
                <input 
                  type="range"
                  class="minimap-slider"
                  id="minimap-slider"
                  min="0.5" 
                  max="2.0" 
                  step="0.25" 
                  .value=${this.gameplaySettings.minimapSize} 
                  @input=${this._setMinimapSize} 
                />
                <bitmap-text .fontRenderer=${this.fontRenderer} text=${`${Math.round(this.gameplaySettings.minimapSize * 100)}%`} scale="1.8"></bitmap-text>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-title-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Keybind Settings" scale="2.2"></bitmap-text>
            </div>
            <div class="keybind-list">
              ${map(keybindActions, (action) => html`
                <div class="keybind-item">
                  <div class="label-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} scale="1.8"></bitmap-text>
                  </div>
                  <keybind-display
                    .action=${action}
                    .currentKey=${this.keybinds[action]}
                    .hasError=${duplicates.has(this.keybinds[action])}
                    .fontRenderer=${this.fontRenderer}
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