import { LitElement, html, css } from 'lit';
import { formatTime } from '../ui-utils.js';
import './bitmap-text.js';

export class LevelCompleteModal extends LitElement {
  static styles = css`
    .modal-overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center; z-index: 300;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); color: #eee;
      text-align: center; position: relative; width: 90%; max-width: 500px;
    }
    .title-container { display: flex; justify-content: center; margin-bottom: 25px; }
    .stats-container {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; margin-bottom: 25px; padding: 15px;
      background-color: #444; border-radius: 8px;
    }
    .button-container { display: flex; justify-content: center; gap: 15px; }
    .modal-image-button {
      background: transparent; border: none; padding: 0;
      cursor: pointer; width: 48px; height: 48px;
      transition: transform 0.2s ease-in-out;
    }
    .modal-image-button:hover:not(:disabled) { transform: scale(1.1); }
    .modal-image-button:disabled { cursor: not-allowed; filter: grayscale(1); opacity: 0.6; }
    .modal-image-button img { width: 100%; height: 100%; }
  `;

  static properties = {
    stats: { type: Object },
    hasNextLevel: { type: Boolean },
    hasPreviousLevel: { type: Boolean },
    fontRenderer: { type: Object },
  };

  _dispatch(eventName) {
    this.dispatchEvent(new CustomEvent(eventName));
  }

  render() {
    if (!this.stats) return html``;

    return html`
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Level Complete!" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div class="stats-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Deaths: ${this.stats.deaths}" scale="1.8"></bitmap-text>
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Time: ${formatTime(this.stats.time)}" scale="1.8"></bitmap-text>
          </div>
          <div class="button-container">
            <button class="modal-image-button" title="Previous Level" ?disabled=${!this.hasPreviousLevel} @click=${() => this._dispatch('previous-level')}>
              <img src="/assets/Menu/Buttons/Previous.png" alt="Previous">
            </button>
            <button class="modal-image-button" title="Restart Level" @click=${() => this._dispatch('restart-level')}>
              <img src="/assets/Menu/Buttons/Restart.png" alt="Restart">
            </button>
            <button class="modal-image-button" title="Next Level" ?disabled=${!this.hasNextLevel} @click=${() => this._dispatch('next-level')}>
              <img src="/assets/Menu/Buttons/Next.png" alt="Next">
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('level-complete-modal', LevelCompleteModal);