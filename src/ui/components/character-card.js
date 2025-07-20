import { LitElement, html, css } from 'lit';
import { characterConfig } from '../../entities/level-definitions.js';
import './bitmap-text.js';

export class CharacterCard extends LitElement {
  static styles = css`
    :host {
      /* This allows the card to participate correctly in a flex/grid layout */
      display: flex;
    }
    .character-card {
      background-color: #555; border: 2px solid #777; border-radius: 8px;
      padding: 15px; display: flex; flex-direction: column;
      align-items: center; gap: 10px; transition: all 0.2s ease-in-out;
      position: relative;
      width: 100%; /* Fill the grid cell */
      box-sizing: border-box; /* Include padding in width calculation */
    }
    .character-card:not(.locked):hover { border-color: #007bff; transform: translateY(-3px); }
    .character-card.locked { opacity: 0.6; cursor: not-allowed; }
    .character-card.selected { border-color: #4CAF50; }
    
    .char-canvas {
      width: 64px; height: 64px; background-color: #444; border-radius: 6px;
      image-rendering: pixelated;
      flex-shrink: 0; /* Prevent canvas from shrinking */
    }
    .char-name-container { 
      /* Removed min-height. Let it size to the text. */
      margin-top: 5px;
    }
    .char-unlock-container { 
      /* Removed min-height. Let it size to the text. */
      display: flex; flex-direction: column; 
      justify-content: center; align-items: center;
      flex-grow: 1; /* This is key: it will take up available space, pushing the button down */
    }
    
    .select-button {
      background-color: #007bff; color: #fff; border: none; padding: 10px 15px;
      border-radius: 6px; cursor: pointer; width: 100%;
      transition: background-color 0.2s;
      display: flex; justify-content: center; align-items: center;
      margin-top: auto; /* Push the button to the bottom of the card */
      flex-shrink: 0; /* Prevent button from shrinking */
    }
    .select-button:hover:not(:disabled) { background-color: #0056b3; }
    
    .selected .select-button { background-color: #4CAF50; cursor: default; }
    .locked .select-button { background-color: #666; cursor: not-allowed; }
  `;

  // ... (The rest of the component's JavaScript is unchanged) ...

  static properties = {
    characterId: { type: String },
    idleSprite: { type: Object },
    isLocked: { type: Boolean },
    isSelected: { type: Boolean },
    fontRenderer: { type: Object },
  };

  constructor() {
    super();
    this.animationFrameId = null;
    this.animState = { frame: 0, timer: 0, lastTime: 0 };
  }

  connectedCallback() {
    super.connectedCallback();
    this.animationFrameId = requestAnimationFrame(this._animatePreview);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  _animatePreview = (timestamp) => {
    const canvas = this.shadowRoot.querySelector('.char-canvas');
    if (!canvas || !this.idleSprite) {
      this.animationFrameId = requestAnimationFrame(this._animatePreview);
      return;
    };

    if (this.animState.lastTime === 0) this.animState.lastTime = timestamp;
    
    const deltaTime = (timestamp - this.animState.lastTime) / 1000;
    this.animState.lastTime = timestamp;
    this.animState.timer += deltaTime;

    const animationSpeed = 0.08, frameCount = 11;
    const frameWidth = this.idleSprite.width / frameCount;

    if (this.animState.timer >= animationSpeed) {
      this.animState.timer = 0;
      this.animState.frame = (this.animState.frame + 1) % frameCount;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        this.idleSprite,
        this.animState.frame * frameWidth, 0, frameWidth, this.idleSprite.height,
        0, 0, canvas.width, canvas.height
      );
    }
    this.animationFrameId = requestAnimationFrame(this._animatePreview);
  }
  
  _handleSelect() {
      if (this.isLocked || this.isSelected) return;
      this.dispatchEvent(new CustomEvent('character-selected', {
          detail: { characterId: this.characterId },
          bubbles: true,
          composed: true
      }));
  }

  render() {
    const config = characterConfig[this.characterId];
    const classes = `character-card ${this.isLocked ? 'locked' : ''} ${this.isSelected ? 'selected' : ''}`;
    const buttonText = this.isLocked ? 'Locked' : (this.isSelected ? 'Selected' : 'Select');

    return html`
      <div class=${classes}>
        <canvas class="char-canvas" width="64" height="64"></canvas>
        <div class="char-name-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} .text=${config.name} scale="2"></bitmap-text>
        </div>
        <div class="char-unlock-container">
          ${this.isLocked 
            ? html`
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Complete ${config.unlockRequirement} levels" scale="1.5" color="#ccc"></bitmap-text>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="to unlock" scale="1.5" color="#ccc"></bitmap-text>
              `
            : html`<bitmap-text .fontRenderer=${this.fontRenderer} text="Available" scale="1.5" color="#ccc"></bitmap-text>`
          }
        </div>
        <button class="select-button" @click=${this._handleSelect} ?disabled=${this.isLocked || this.isSelected}>
          <bitmap-text .fontRenderer=${this.fontRenderer} .text=${buttonText} scale="1.8"></bitmap-text>
        </button>
      </div>
    `;
  }
}

customElements.define('character-card', CharacterCard);