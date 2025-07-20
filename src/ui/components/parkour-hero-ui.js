import { LitElement, html, css } from 'lit';
import { eventBus } from '../../utils/event-bus.js';
import './settings-menu.js';
import './pause-modal.js';
import './levels-menu.js';
import './character-menu.js';
import './info-modal.js';

export class ParkourHeroUI extends LitElement {
  static styles = css`
    /* Styles for main menu from main-menu.css */
    .main-menu-overlay {
      position: fixed; inset: 0;
      background-image: url('/assets/Background/Main Menu.png');
      background-size: cover; background-position: center; z-index: 500;
      display: flex; justify-content: center; align-items: center;
      flex-direction: column; color: white;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
    }
    .main-menu-container { display: flex; flex-direction: column; align-items: center; gap: 40px; }
    .game-title { font-size: 6em; font-weight: bold; margin: 0; letter-spacing: 2px; -webkit-text-stroke: 2px black; }
    .main-menu-buttons { display: flex; flex-direction: column; gap: 20px; width: 250px; }
    .main-menu-buttons button {
      background-color: #007bff; color: #fff; border: 3px solid #0056b3;
      padding: 15px 25px; border-radius: 12px; cursor: pointer; font-size: 1.5em;
      font-weight: bold; transition: all 0.2s ease-in-out;
      box-shadow: 0 6px #004a99; text-transform: uppercase;
    }
    .main-menu-buttons button:hover { background-color: #0056b3; transform: translateY(-2px); box-shadow: 0 8px #004a99; }
    .main-menu-buttons button:active { transform: translateY(2px); box-shadow: 0 2px #004a99; }
  `;

  static properties = {
    activeModal: { type: String, state: true },
    gameHasStarted: { type: Boolean, state: true },
    keybinds: { type: Object, state: true },
    soundSettings: { type: Object, state: true },
    currentStats: { type: Object, state: true },
    gameState: { type: Object, state: true },
    assets: { type: Object, state: true },
    fontRenderer: { type: Object },
  };

  constructor() {
    super();
    this.activeModal = 'main-menu';
    this.gameHasStarted = false;
    this.keybinds = { moveLeft: 'a', moveRight: 'd', jump: 'w', dash: ' ' };
    this.soundSettings = { soundEnabled: true, soundVolume: 0.5 };
    this.currentStats = {};
    this.gameState = null;
    this.assets = null;
    this.fontRenderer = null;
  }

  connectedCallback() {
    super.connectedCallback();
    eventBus.subscribe('requestStartGame', this._handleStartGame);
    eventBus.subscribe('soundSettingsChanged', this._handleSoundUpdate);
    eventBus.subscribe('keybindsUpdated', this._handleKeybindsUpdate);
    eventBus.subscribe('ui_button_clicked', this._handleUIButtonClick);
    eventBus.subscribe('statsUpdated', this._handleStatsUpdate);
    eventBus.subscribe('action_escape_pressed', this._handleEscapePress);
    eventBus.subscribe('levelLoaded', ({ gameState }) => this.gameState = gameState);
    eventBus.subscribe('gameStateUpdated', (gameState) => this.gameState = gameState);
    eventBus.subscribe('assetsLoaded', (assets) => this.assets = assets);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    eventBus.unsubscribe('requestStartGame', this._handleStartGame);
    eventBus.unsubscribe('soundSettingsChanged', this._handleSoundUpdate);
    eventBus.unsubscribe('keybindsUpdated', this._handleKeybindsUpdate);
    eventBus.unsubscribe('ui_button_clicked', this._handleUIButtonClick);
    eventBus.unsubscribe('statsUpdated', this._handleStatsUpdate);
    eventBus.unsubscribe('action_escape_pressed', this._handleEscapePress);
    eventBus.unsubscribe('levelLoaded', ({ gameState }) => this.gameState = gameState);
    eventBus.unsubscribe('gameStateUpdated', (gameState) => this.gameState = gameState);
    eventBus.unsubscribe('assetsLoaded', (assets) => this.assets = assets);
  }

  _handleStartGame = () => {
    this.gameHasStarted = true;
    this.activeModal = null;
    eventBus.publish('allMenusClosed');
  };

  _handleSoundUpdate = (settings) => { this.soundSettings = { ...settings }; };
  _handleKeybindsUpdate = (keybinds) => { this.keybinds = { ...keybinds }; };
  _handleStatsUpdate = (stats) => { this.currentStats = { ...stats }; };

  _handleUIButtonClick = ({ buttonId }) => {
    if (buttonId === 'pause') {
      if (this.activeModal) { this._closeModal(); } 
      else if (this.gameHasStarted) { this.activeModal = 'pause'; eventBus.publish('menuOpened'); }
    } else {
      this.activeModal = buttonId;
      eventBus.publish('menuOpened');
    }
  };

  _handleEscapePress = () => {
    if (this.activeModal) { this._closeModal(); }
    else if (this.gameHasStarted) { this.activeModal = 'pause'; eventBus.publish('menuOpened'); }
  };

  _handleKeybindChange = (e) => {
    const { action, newKey } = e.detail;
    const newKeybinds = { ...this.keybinds, [action]: newKey };
    eventBus.publish('keybindsUpdated', newKeybinds);
  };
  
  _closeModal = () => {
    const wasOpen = this.activeModal !== null;
    this.activeModal = this.gameHasStarted ? null : 'main-menu';
    if (wasOpen && this.gameHasStarted) { eventBus.publish('allMenusClosed'); }
  }
  
  _openModalFromMenu(modalName) {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
      this.activeModal = modalName;
  }

  // --- Modal Event Handlers ---
  _handleRestart() { this._closeModal(); eventBus.publish('requestLevelRestart'); }
  _handleOpenLevelsMenu() { this.activeModal = 'levels'; }
  
  _handleLevelSelected(e) {
    const { sectionIndex, levelIndex } = e.detail;
    this._closeModal();
    eventBus.publish('requestLevelLoad', { sectionIndex, levelIndex });
  }
  
  _handleCharacterSelected(e) {
    const { characterId } = e.detail;
    this.gameState.setSelectedCharacter(characterId);
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
    eventBus.publish('characterUpdated', characterId);
    this.gameState = { ...this.gameState };
  }

  render() {
    if (this.activeModal === 'main-menu' && !this.gameHasStarted) {
      return this.renderMainMenu();
    }
    return this.renderActiveModal();
  }
  
  renderMainMenu() {
    return html`
      <div class="main-menu-overlay">
        <div class="main-menu-container">
          <h1 class="game-title">Parkour Hero</h1>
          <div class="main-menu-buttons">
            <button @click=${() => eventBus.publish('requestStartGame')}>Start Game</button>
            <button @click=${() => this._openModalFromMenu('levels')}>Levels</button>
            <button @click=${() => this._openModalFromMenu('character')}>Character</button>
            <button @click=${() => this._openModalFromMenu('settings')}>Settings</button>
          </div>
        </div>
      </div>
    `;
  }
  
  renderActiveModal() {
    switch (this.activeModal) {
      case 'settings':
        return html`<settings-menu 
                      .keybinds=${this.keybinds} .soundSettings=${this.soundSettings}
                      @close-modal=${this._closeModal} @keybind-changed=${this._handleKeybindChange}
                    ></settings-menu>`;
      case 'pause':
        return html`<pause-modal
                      .stats=${this.currentStats}
                      .fontRenderer=${this.fontRenderer}
                      @resume-game=${this._closeModal} @restart-level=${this._handleRestart} @open-levels-menu=${this._handleOpenLevelsMenu}
                    ></pause-modal>`;
      case 'levels':
        return html`<levels-menu
                      .gameState=${this.gameState}
                      @close-modal=${this._closeModal} @level-selected=${this._handleLevelSelected}
                    ></levels-menu>`;
      case 'character':
        return html`<character-menu
                      .gameState=${this.gameState} .assets=${this.assets}
                      @close-modal=${this._closeModal} @character-selected=${this._handleCharacterSelected}
                    ></character-menu>`;
      case 'info':
        return html`<info-modal
                      .keybinds=${this.keybinds}
                      @close-modal=${this._closeModal}
                    ></info-modal>`;
      default:
        return html``;
    }
  }
}

customElements.define('parkour-hero-ui', ParkourHeroUI);