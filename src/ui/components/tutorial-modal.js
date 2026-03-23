import { LitElement, html, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { eventBus } from '../../utils/event-bus.js';
import './bitmap-text.js';
import './keybind-display.js';
import './animated-sprite-card.js';

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
      text-align: center; position: relative; width: 90%; max-width: 750px;
      max-height: 90vh; display: flex; flex-direction: column;
    }
    .scrollable-content {
        flex-grow: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 5px;
        margin: 0 -5px;
    }
    .title-container, .section-title-container {
      display: flex; justify-content: center;
    }
    .title-container {
      margin-bottom: 20px;
      flex-shrink: 0;
    }
    .section {
      background-color: #444; border-radius: 8px; border: 1px solid #555;
      padding: 15px; text-align: left; display: flex; flex-direction: column; gap: 15px;
    }
    p { margin: 0; line-height: 1.6; }
    .controls-grid {
      display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; align-items: center;
    }
    .keybind-list { display: flex; flex-direction: column; gap: 10px; }
    .keybind-item { display: flex; justify-content: space-between; align-items: center; background-color: #555; padding: 10px 15px; border-radius: 8px; }
    .keybind-item .label-container { margin-right: 15px; flex-grow: 1; text-align: left; }
    
    .key-display {
      background-color: #666; color: #fff; border: 1px solid #777;
      border-radius: 6px; text-align: center;
      min-width: 20px; display: inline-flex; justify-content: center;
      align-items: center; padding: 5px 8px;
    }
    .footer-actions {
        flex-shrink: 0;
        padding-top: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .action-button {
      background-color: #007bff; color: #fff; border: 2px solid #0056b3;
      padding: 10px 20px; border-radius: 8px; cursor: pointer;
      display: flex; justify-content: center; align-items: center;
      transition: all 0.2s ease-in-out;
    }
    .action-button:hover:not(:disabled) { background-color: #0056b3; }
    .action-button:disabled {
      background-color: #555;
      border-color: #444;
      color: #999;
      cursor: not-allowed;
    }
    .visual-row {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 10px;
      flex-wrap: wrap;
    }
    .visual-row animated-sprite-card {
      width: 140px;
      flex-shrink: 0;
    }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #2a2a2a; border-radius: 4px; }
    ::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #777; }
  `;

  static properties = {
    keybinds: { type: Object },
    fontRenderer: { type: Object },
    assets: { type: Object },
    hasScrolledToBottom: { type: Boolean, state: true }
  };

  constructor() {
    super();
    this.hasScrolledToBottom = false;
  }

  firstUpdated() {
    setTimeout(() => {
      const scrollContainer = this.shadowRoot.querySelector('.scrollable-content');
      if (scrollContainer) {
        this._checkScroll(scrollContainer);
      }
    }, 0);
  }

  _checkScroll(container) {
    if (this.hasScrolledToBottom) return;
    if (container.scrollHeight - container.scrollTop <= container.clientHeight + 5) {
      this.hasScrolledToBottom = true;
    }
  }

  _handleScroll(e) {
    this._checkScroll(e.target);
  }

  _dispatchClose() {
    if (!this.hasScrolledToBottom) return;
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
    this.dispatchEvent(new CustomEvent('close-modal', { bubbles: true, composed: true }));
  }

  render() {
    if (!this.keybinds || !this.fontRenderer || !this.assets) return html``;

    const keybindActions = Object.keys(this.keybinds);

    return html`
      <div class="modal-overlay">
        <div class="modal-content" @click=${e => e.stopPropagation()}>
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Welcome to Parkour Hero!" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>

          <div class="scrollable-content" @scroll=${this._handleScroll}>
              <div class="section">
                <div class="section-title-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Configure Keybinds" scale="2.2"></bitmap-text>
                </div>
                <p>Before you start, make sure your controls are set up how you like them!</p>
                <div class="keybind-list">
                  ${map(keybindActions, (action) => html`
                    <div class="keybind-item">
                      <div class="label-container">
                        <bitmap-text .fontRenderer=${this.fontRenderer} text=${action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} scale="1.8"></bitmap-text>
                      </div>
                      <keybind-display
                        .action=${action}
                        .currentKey=${this.keybinds[action]}
                        .fontRenderer=${this.fontRenderer}
                      ></keybind-display>
                    </div>
                  `)}
                </div>
              </div>

              <div class="section">
                <div class="section-title-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="The Goal" scale="2.2"></bitmap-text>
                </div>
                <p>Your mission is to collect all the fruit to unlock the trophy, then reach it to complete the level!</p>
                <div class="visual-row">
                  <animated-sprite-card .sprite=${this.assets.fruit_apple} .frameCount=${17} .frameSpeed=${0.07}>
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Collect Fruit" scale="1.2"></bitmap-text>
                  </animated-sprite-card>
                  <animated-sprite-card .sprite=${this.assets.trophy_idle} .frameCount=${1} .frameSpeed=${0.07}>
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Unlock Trophy" scale="1.2"></bitmap-text>
                  </animated-sprite-card>
                </div>
              </div>

              <div class="section">
                <div class="section-title-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Advanced Moves" scale="2.2"></bitmap-text>
                </div>
                <p>Press Jump in the air for a <strong>Double Jump</strong>. Move into a wall while falling to slide, then press Jump for a <strong>Wall Jump</strong>!</p>
                <p>Dashing allows you to quickly cover ground and avoid dangers.</p>
                <div class="visual-row">
                  <animated-sprite-card .sprite=${this.assets.characters?.PinkMan?.playerDoubleJump} .frameCount=${6} .frameSpeed=${0.06}>
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Double Jump" scale="1.2"></bitmap-text>
                  </animated-sprite-card>
                  <animated-sprite-card .sprite=${this.assets.characters?.PinkMan?.playerCling} .frameCount=${5} .frameSpeed=${0.06}>
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Wall Jump" scale="1.2"></bitmap-text>
                  </animated-sprite-card>
                  <animated-sprite-card .sprite=${this.assets.characters?.PinkMan?.playerDash} .frameCount=${1} .frameSpeed=${0.06}>
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Dash" scale="1.2"></bitmap-text>
                  </animated-sprite-card>
                </div>
              </div>

              <div class="section">
                <div class="section-title-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Enemies & Environment" scale="2.2"></bitmap-text>
                </div>
                <p>This world is full of critters! Most can be defeated by jumping on their heads. Bumping into them from the side is a bad idea. Some foes are trickier than they look!</p>
                <div class="visual-row">
                  <animated-sprite-card .sprite=${this.assets.mushroom_idle} .frameCount=${14} .frameSpeed=${0.1}>
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Critters" scale="1.2"></bitmap-text>
                  </animated-sprite-card>
                  <animated-sprite-card .sprite=${this.assets.spike_two} .frameCount=${1} .frameSpeed=${0.1}>
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Hazards" scale="1.2"></bitmap-text>
                  </animated-sprite-card>
                </div>
                <p>Also, be sure to avoid dangerous traps as you traverse each section! Luckily, fruits do heal you from most damage.</p>
              </div>
              
              <div class="section">
                <div class="section-title-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Interface" scale="2.2"></bitmap-text>
                </div>
                <p>The buttons in the top-right corner allow you to change settings, pause the game, select levels, and more at any time.</p>
              </div>
          </div>
          
          <div class="footer-actions">
            <button class="action-button" @click=${this._dispatchClose} ?disabled=${!this.hasScrolledToBottom}>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Got It!" scale="2" color=${this.hasScrolledToBottom ? 'white' : '#999'}></bitmap-text>
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('tutorial-modal', TutorialModal);