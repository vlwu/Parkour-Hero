import { LitElement, html, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { levelSections } from '../../entities/level-definitions.js';
import { eventBus } from '../../utils/event-bus.js';
import { formatTime } from '../ui-utils.js';
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
      border: none; cursor: pointer;
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
    
    /* DIY Section Specific Styling */
    .level-section-menu.diy-section {
        background-color: #1e2a38;
        border: 2px dashed #3498db;
        background-image:
            linear-gradient(rgba(52, 152, 219, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(52, 152, 219, 0.05) 1px, transparent 1px);
        background-size: 20px 20px;
    }

    .section-title-container {
      margin: 0 0 15px 0;
      border-bottom: 2px solid #555;
      padding-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
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
      width: 100%;
      height: 100%;
    }
    .level-button:not(:disabled):hover {
      background-color: #007bff; border-color: #0056b3; transform: translateY(-2px);
    }
    
    /* Level Status Aesthetics */
    .level-button.completed { 
        background-color: #555; 
        border-color: #4CAF50; 
        box-shadow: 0 0 10px rgba(76, 175, 80, 0.4), inset 0 0 10px rgba(76, 175, 80, 0.2);
    }
    .level-button.current { 
        border-color: #ffc107; 
        box-shadow: 0 0 12px rgba(255, 193, 7, 0.8), inset 0 0 8px rgba(255, 193, 7, 0.4); 
    }
    .level-button.completed.current {
        border-color: #ffc107;
        box-shadow: 0 0 12px rgba(255, 193, 7, 0.8), inset 0 0 10px rgba(76, 175, 80, 0.4);
    }
    .level-button.locked { 
        background-color: #444; color: #777; cursor: not-allowed; border-color: #666; 
        filter: grayscale(100%) brightness(0.6);
    }
    .level-button.locked svg { fill: #777; width: 24px; height: 24px; }

    @keyframes pulse-next {
        0% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(52, 152, 219, 0); }
        100% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0); }
    }
    .level-button.next-unlocked {
        border-color: #3498db;
        animation: pulse-next 2s infinite;
    }

    .level-button.add-level {
        background-color: #444;
        border-style: dashed;
        font-size: 2em;
        box-shadow: none;
        animation: none;
        filter: none;
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

    .level-button-container {
      position: relative;
      aspect-ratio: 1 / 1;
      display: flex;
    }
    .level-button-container:hover {
      z-index: 20;
    }
    
    .menu-button {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 24px;
      height: 24px;
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      color: white;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0;
      line-height: 1;
      font-size: 18px;
      z-index: 5;
    }
    .menu-button:hover {
      background: rgba(0,0,0,0.8);
    }
    
    .context-menu {
      position: absolute;
      top: 32px;
      right: 2px;
      background-color: #444;
      border: 1px solid #555;
      border-radius: 6px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      z-index: 10;
      width: 100px;
    }
    .context-menu button {
      display: block;
      width: 100%;
      padding: 10px;
      background: none;
      border: none;
      color: #eee;
      text-align: left;
      cursor: pointer;
    }
    .context-menu button:hover {
      background-color: #555;
    }

    /* Tooltip styles */
    .tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(-10px);
      background-color: rgba(0, 0, 0, 0.95);
      color: #fff;
      padding: 10px;
      border-radius: 6px;
      font-size: 14px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s, transform 0.2s;
      z-index: 100;
      border: 1px solid #4CAF50;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.5);
    }
    .level-button-container:hover .tooltip {
      opacity: 1;
      transform: translateX(-50%) translateY(-5px);
    }
    .tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      margin-left: -6px;
      border-width: 6px;
      border-style: solid;
      border-color: #4CAF50 transparent transparent transparent;
    }
    .stat-line {
        display: flex;
        justify-content: space-between;
        gap: 15px;
    }
    .stat-label { color: #aaa; }
    .stat-value { color: #fff; font-weight: bold; text-align: right; }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #2a2a2a; border-radius: 4px; }
    ::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #777; }
  `;

  static properties = {
    gameState: { type: Object },
    fontRenderer: { type: Object },
    activeMenuIndex: { type: String, state: true },
  };

  constructor() {
    super();
    this.activeMenuIndex = null;
    document.addEventListener('click', this._handleGlobalClick, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleGlobalClick, true);
  }

  _handleGlobalClick = (e) => {
    if (this.activeMenuIndex && !e.composedPath().some(el => el.classList?.contains('context-menu-container'))) {
      this.activeMenuIndex = null;
    }
  }

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

  _handleMenuClick(e, sectionIndex, levelIndex) {
    e.stopPropagation();
    const menuId = `${sectionIndex}-${levelIndex}`;
    this.activeMenuIndex = this.activeMenuIndex === menuId ? null : menuId;
  }

  _handleEditLevel(sectionIndex, levelIndex) {
    const levelData = levelSections[sectionIndex].levels[levelIndex];
    sessionStorage.setItem('editingLevelData', JSON.stringify(levelData));
    sessionStorage.setItem('editingLevelIndex', levelIndex.toString());
    window.location.href = 'editor.html';
  }

  _handleDeleteLevel(sectionIndex, levelIndex) {
    if (confirm(`Are you sure you want to delete "${levelSections[sectionIndex].levels[levelIndex].name}"? This action cannot be undone.`)) {
        eventBus.publish('deleteDIYLevel', { levelIndex });
    }
    this.activeMenuIndex = null;
  }

  _getLevelContent(sectionName, levelIndex, isUnlocked) {
    if (!isUnlocked) {
      return html`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"></path>
        </svg>
      `;
    }
    
    if (sectionName !== 'DIY' && levelIndex < 10) {
      const imgName = levelIndex === 9 ? 'final.png' : `0${levelIndex + 1}.png`;
      return html`<img src="/assets/Menu/Levels/${imgName}" style="width: 34px; height: 38px; image-rendering: pixelated;" alt="${levelIndex + 1}">`;
    }
    return html`${levelIndex + 1}`;
  }

  _renderLevelButton(section, sectionIndex, levelIndex, isUnlocked, isCompleted, isCurrent, isNextUnlocked) {
    const classes = `level-button ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''} ${isNextUnlocked ? 'next-unlocked' : ''}`;
    const stats = this.gameState.levelStats[`${sectionIndex}-${levelIndex}`];

    const tooltipHtml = (isCompleted && stats) ? html`
        <div class="tooltip">
            <div class="stat-line"><span class="stat-label">Best Time:</span> <span class="stat-value">${stats.fastestTime !== null ? formatTime(stats.fastestTime) : '--:--.--'}</span></div>
            <div class="stat-line"><span class="stat-label">Min Deaths:</span> <span class="stat-value">${stats.lowestDeaths !== null ? stats.lowestDeaths : '-'}</span></div>
        </div>
    ` : '';

    if (section.name === 'DIY') {
        const menuId = `${sectionIndex}-${levelIndex}`;
        return html`
          <div class="level-button-container context-menu-container">
            <button class=${classes} @click=${() => this._selectLevel(sectionIndex, levelIndex)}>${this._getLevelContent(section.name, levelIndex, true)}</button>
            ${tooltipHtml}
            <button class="menu-button" @click=${(e) => this._handleMenuClick(e, sectionIndex, levelIndex)}>⋮</button>
            ${this.activeMenuIndex === menuId ? html`
              <div class="context-menu">
                <button @click=${() => this._handleEditLevel(sectionIndex, levelIndex)}>Edit</button>
                <button @click=${() => this._handleDeleteLevel(sectionIndex, levelIndex)}>Delete</button>
              </div>
            ` : ''}
          </div>
        `;
    }

    return html`
        <div class="level-button-container">
            <button class=${classes} ?disabled=${!isUnlocked} @click=${() => this._selectLevel(sectionIndex, levelIndex)}>
                ${this._getLevelContent(section.name, levelIndex, isUnlocked)}
            </button>
            ${tooltipHtml}
        </div>
    `;
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

          <div class="scrollable-content">
            <div id="level-selection-container">
              ${map(levelSections, (section, sectionIndex) => {
                const isDIY = section.name === 'DIY';
                const sectionClasses = `level-section-menu ${isDIY ? 'diy-section' : ''}`;
                const completedCount = section.levels.filter((_, lIdx) => this.gameState.isLevelCompleted(sectionIndex, lIdx)).length;

                return html`
                  <div class="${sectionClasses}">
                    <div class="section-title-container">
                      <bitmap-text .fontRenderer=${this.fontRenderer} text=${section.name} scale="2"></bitmap-text>
                      ${!isDIY ? html`
                        <bitmap-text .fontRenderer=${this.fontRenderer} text="${completedCount}/${section.levels.length}" scale="1.5" color="#aaa"></bitmap-text>
                      ` : html`
                        <bitmap-text .fontRenderer=${this.fontRenderer} text="${section.levels.length} Levels" scale="1.5" color="#aaa"></bitmap-text>
                      `}
                    </div>
                    <div class="level-grid">
                      ${map(section.levels, (_, levelIndex) => {
                        const isUnlocked = this.gameState.isLevelUnlocked(sectionIndex, levelIndex);
                        const isCompleted = this.gameState.isLevelCompleted(sectionIndex, levelIndex);
                        const isCurrent = this.gameState.currentSection === sectionIndex && this.gameState.currentLevelIndex === levelIndex;
                        const isNextUnlocked = isUnlocked && !isCompleted;

                        return this._renderLevelButton(section, sectionIndex, levelIndex, isUnlocked, isCompleted, isCurrent, isNextUnlocked);
                      })}
                      ${isDIY ? html`
                        <div class="level-button-container">
                            <button class="level-button add-level" @click=${this._goToEditor} title="Create New Level">+</button>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `;
              })}
            </div>
          </div>

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