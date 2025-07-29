import { LitElement, html, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { levelSections } from '../../entities/level-definitions.js';
import { eventBus } from '../../utils/event-bus.js';
import './bitmap-text.js';

export class LevelsMenu extends LitElement {
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
      background-color: #333;
      border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
      color: #eee;
      text-align: center;
      position: relative;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;

      display: flex;
      flex-direction: column;

      padding: 20px;
      box-sizing: border-box;
    }


    .scrollable-content {
      flex-grow: 1;
      overflow-y: auto;
      padding: 10px 5px;
      margin: 0 -5px;
    }


    .footer-actions {
        flex-shrink: 0;
        padding-top: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-top: 1px solid #444;
    }


    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('/assets/Menu/Buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer; border-radius: 50%;
      transition: transform 0.2s ease-in-out;
      z-index: 10;
    }
    .close-button:hover { transform: scale(1.1); }

    .title-container {
      display: flex;
      justify-content: center;
      margin-bottom: 25px;
      flex-shrink: 0;
    }

    #level-selection-container {
      display: flex; flex-direction: column; gap: 20px;
    }
    .level-section-menu {
      background-color: #3a3a3a; border-radius: 8px; padding: 15px; border: 1px solid #4a4a4a;
    }
    .section-title-container {
      margin: 0 0 15px 0;
      border-bottom: 2px solid #555;
      padding-bottom: 10px;
    }
    .level-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
    }
    .level-button {
      background-color: #555; color: #fff; border: 2px solid #777;
      padding: 15px 10px; border-radius: 8px; cursor: pointer;
      font-size: 1.2em; font-weight: bold; transition: all 0.2s ease-in-out;
      display: flex; justify-content: center; align-items: center;
      min-height: 53px; box-sizing: border-box;
      aspect-ratio: 1 / 1;
    }
    .level-button:not(:disabled):hover {
      background-color: #007bff; border-color: #0056b3; transform: translateY(-2px);
    }
    .level-button.completed { background-color: #4CAF50; border-color: #45a049; }
    .level-button.current { border-color: #ffc107; box-shadow: 0 0 8px rgba(255, 193, 7, 0.7); }
    .level-button.locked { background-color: #444; color: #777; cursor: not-allowed; border-color: #666; }
    .level-button.locked svg { fill: #777; width: 24px; height: 24px; }

    .level-button.add-level {
        background-color: #444;
        border-style: dashed;
        font-size: 2em;
    }
    .level-button.add-level:hover {
        background-color: #555;
        border-color: #888;
    }

    .footer-button {
      background-color: #007bff; color: #fff; border: 2px solid #0056b3;
      padding: 10px 20px; border-radius: 8px; cursor: pointer;
      display: flex; justify-content: center; align-items: center;
      transition: all 0.2s ease-in-out;
    }
    .footer-button:hover {
      background-color: #0056b3;
    }
  `;

  static properties = {
    gameState: { type: Object },
    fontRenderer: { type: Object },
  };

  _dispatchClose() {
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
    this.dispatchEvent(new CustomEvent('close-modal', { bubbles: true, composed: true }));
  }

  _selectLevel(sectionIndex, levelIndex) {
    this.dispatchEvent(new CustomEvent('level-selected', {
      detail: { sectionIndex, levelIndex },
      bubbles: true,
      composed: true
    }));
  }

  _openStatsModal() {
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
    eventBus.publish('ui_button_clicked', { buttonId: 'stats' });
  }

  _goToEditor() {
    window.location.href = 'editor.html';
  }

  render() {
    if (!this.gameState) {
      return html``;
    }

    return html`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e => e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>

          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Levels Menu" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>

          <!-- The new scrollable container -->
          <div class="scrollable-content">
            <div id="level-selection-container">
              ${map(levelSections, (section, sectionIndex) => html`
                <div class="level-section-menu">
                  <div class="section-title-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${section.name} scale="2"></bitmap-text>
                  </div>
                  <div class="level-grid">
                    ${map(section.levels, (_, levelIndex) => {
                      const isUnlocked = this.gameState.isLevelUnlocked(sectionIndex, levelIndex);
                      const isCompleted = this.gameState.isLevelCompleted(sectionIndex, levelIndex);
                      const isCurrent = this.gameState.currentSection === sectionIndex && this.gameState.currentLevelIndex === levelIndex;

                      const classes = `level-button ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}`;

                      return isUnlocked
                        ? html`<button class=${classes} @click=${() => this._selectLevel(sectionIndex, levelIndex)}>${levelIndex + 1}</button>`
                        : html`<button class=${classes} disabled>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"></path></svg>
                           </button>`;
                    })}
                    ${section.name === 'DIY' ? html`<button class="level-button add-level" @click=${this._goToEditor} title="Create New Level">+</button>` : ''}
                  </div>
                </div>
              `)}
            </div>
          </div>

          <!-- The footer is now outside the scrollable area -->
          <div class="footer-actions">
            <button class="footer-button" @click=${this._openStatsModal}>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="View Stats" scale="1.8"></bitmap-text>
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('levels-menu', LevelsMenu);