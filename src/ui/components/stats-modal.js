import { LitElement, html, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { levelSections } from '../../entities/level-definitions.js';
import { eventBus } from '../../utils/event-bus.js';
import { formatTime } from '../ui-utils.js';
import './bitmap-text.js';

export class StatsModal extends LitElement {
  static styles = css`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: fixed; inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center;
      z-index: 250;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); color: #eee;
      text-align: center; position: relative; width: 90%;
      max-width: 700px; max-height: 80vh; overflow-y: auto;
    }
    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('/assets/Menu/Buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer; border-radius: 50%;
      transition: transform 0.2s ease-in-out;
    }
    .close-button:hover { transform: scale(1.1); }
    
    .title-container {
      display: flex;
      justify-content: center;
      margin-bottom: 25px;
    }
    
    .stats-list-container {
      display: flex; flex-direction: column; gap: 20px; padding: 10px;
    }
    .level-section-stats {
      background-color: #3a3a3a; border-radius: 8px; padding: 15px; border: 1px solid #4a4a4a;
    }
    .section-title-container {
      margin: 0 0 15px 0;
      border-bottom: 2px solid #555;
      padding-bottom: 10px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 15px;
    }
    .stat-row {
      display: grid;
      grid-template-columns: 100px repeat(3, 1fr);
      align-items: center;
      background-color: #444;
      padding: 10px 15px;
      border-radius: 6px;
      gap: 10px;
      text-align: left;
    }
    .stat-header {
        font-weight: bold;
        color: #ccc;
    }
    .stat-header .stat-cell {
        justify-content: center;
        border-bottom: 1px solid #666;
        padding-bottom: 8px;
    }
    .stat-cell {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .stat-cell.level-name {
        font-weight: bold;
        justify-content: flex-start;
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
  
  _getStatDisplay(value, formatter = null) {
      if (value === null || value === undefined) {
          return '-';
      }
      return formatter ? formatter(value) : value.toString();
  }

  render() {
    if (!this.gameState || !this.gameState.levelStats) {
      return html``;
    }

    const { levelStats } = this.gameState;

    return html`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e => e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Level Statistics" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div class="stats-list-container">
            ${map(levelSections, (section, sectionIndex) => html`
              <div class="level-section-stats">
                <div class="section-title-container">
                  <bitmap-text .fontRenderer=${this.fontRenderer} text=${section.name} scale="2"></bitmap-text>
                </div>
                <div class="stats-grid">
                    <div class="stat-row stat-header">
                        <div class="stat-cell level-name">Level</div>
                        <div class="stat-cell">Fastest Time</div>
                        <div class="stat-cell">Lowest Deaths</div>
                        <div class="stat-cell">Attempts</div>
                    </div>

                  ${map(section.levels, (_, levelIndex) => {
                    const levelId = `${sectionIndex}-${levelIndex}`;
                    const stats = levelStats[levelId] || { fastestTime: null, lowestDeaths: null, totalAttempts: 0 };
                    
                    return html`
                        <div class="stat-row">
                            <div class="stat-cell level-name">Level ${levelIndex + 1}</div>
                            <div class="stat-cell">${this._getStatDisplay(stats.fastestTime, formatTime)}</div>
                            <div class="stat-cell">${this._getStatDisplay(stats.lowestDeaths)}</div>
                            <div class="stat-cell">${this._getStatDisplay(stats.totalAttempts)}</div>
                        </div>
                    `;
                  })}
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('stats-modal', StatsModal);