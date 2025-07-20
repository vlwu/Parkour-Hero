import { LitElement, html, css } from 'lit';
import { eventBus } from '../../utils/event-bus.js';
import './settings-modal.js';
import './pause-modal.js';
import './levels-modal.js';
import './character-modal.js';
import './info-modal.js';
import './level-complete-modal.js';
import './stats-modal.js';
import './bitmap-text.js';

export class ParkourHeroUI extends LitElement {
  static styles = css`
    .main-menu-overlay {
      position: fixed; inset: 0;
      background-image: url('/assets/Background/Main Menu.png');
      background-size: cover; background-position: center; z-index: 500;
      display: flex; justify-content: center; align-items: center;
      flex-direction: column;
    }
    .main-menu-container { display: flex; flex-direction: column; align-items: center; gap: 40px; }
    
    .main-menu-buttons { display: flex; flex-direction: column; gap: 20px; width: 250px; }
    .main-menu-buttons button {
      background-color: #007bff; border: 3px solid #0056b3;
      padding: 15px 25px; border-radius: 12px; cursor: pointer;
      transition: all 0.2s ease-in-out;
      box-shadow: 0 6px #004a99;
      display: flex;
      justify-content: center;
      align-items: center;
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
    levelCompleteStats: { type: Object, state: true },
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
    this.levelCompleteStats = null;
  }

  connectedCallback() {
    super.connectedCallback();
    eventBus.subscribe('requestStartGame', this._handleStartGame);
    eventBus.subscribe('soundSettingsChanged', this._handleSoundUpdate);
    eventBus.subscribe('keybindsUpdated', this._handleKeybindsUpdate);
    eventBus.subscribe('ui_button_clicked', this._handleUIButtonClick);
    eventBus.subscribe('statsUpdated', this._handleStatsUpdate);
    eventBus.subscribe('action_escape_pressed', this._handleEscapePress);
    eventBus.subscribe('levelLoaded', this._handleLevelLoad);
    eventBus.subscribe('gameStateUpdated', (gameState) => this.gameState = gameState);
    eventBus.subscribe('assetsLoaded', (assets) => this.assets = assets);
    eventBus.subscribe('levelComplete', (stats) => this.levelCompleteStats = stats);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // It's good practice to unsubscribe from all events to prevent memory leaks
    eventBus.unsubscribe('requestStartGame', this._handleStartGame);
    eventBus.unsubscribe('soundSettingsChanged', this._handleSoundUpdate);
    eventBus.unsubscribe('keybindsUpdated', this._handleKeybindsUpdate);
    eventBus.unsubscribe('ui_button_clicked', this._handleUIButtonClick);
    eventBus.unsubscribe('statsUpdated', this._handleStatsUpdate);
    eventBus.unsubscribe('action_escape_pressed', this._handleEscapePress);
    eventBus.unsubscribe('levelLoaded', this._handleLevelLoad);
    eventBus.unsubscribe('gameStateUpdated', (gameState) => this.gameState = gameState);
    eventBus.unsubscribe('assetsLoaded', (assets) => this.assets = assets);
    eventBus.unsubscribe('levelComplete', (stats) => this.levelCompleteStats = stats);
  }

  _handleLevelLoad = ({ gameState }) => {
      this.gameState = gameState;
      this.levelCompleteStats = null;
      // FIX: Ensure the UI knows the game has started when a level loads.
      if (!this.gameHasStarted) {
          this.gameHasStarted = true;
      }
      this.activeModal = null;
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
    } else if (buttonId === 'stats') {
        this.activeModal = 'stats';
        eventBus.publish('menuOpened');
    } else {
      this.activeModal = buttonId;
      eventBus.publish('menuOpened');
    }
  };

  _handleEscapePress = () => {
    if (this.levelCompleteStats) return; // Don't let escape close the level complete screen
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

  _handleRestart() { this._closeModal(); eventBus.publish('requestLevelRestart'); }
  _handleOpenLevelsMenu() { this.activeModal = 'levels'; }
  
  _handleLevelSelected(e) {
    const { sectionIndex, levelIndex } = e.detail;
    // FIX: When a level is selected, whether from the main menu or pause menu,
    // we simply publish the request. The engine and the `_handleLevelLoad`
    // callback will handle the state transitions.
    eventBus.publish('requestLevelLoad', { sectionIndex, levelIndex });
  }
  
  _handleCharacterSelected(e) {
    const { characterId } = e.detail;
    const newGameState = this.gameState.setSelectedCharacter(characterId);
    if (newGameState !== this.gameState) {
        this.gameState = newGameState;
        eventBus.publish('gameStateUpdated', this.gameState);
    }
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
    eventBus.publish('characterUpdated', characterId);
  }

  _handleLevelAction(action) {
      this.levelCompleteStats = null;
      if (action === 'restart') { eventBus.publish('requestLevelRestart'); }
      else if (action === 'next') { eventBus.publish('requestNextLevel'); }
      else if (action === 'previous') { eventBus.publish('requestPreviousLevel'); }
  }

  render() {
    // Level complete modal always takes top priority
    if (this.levelCompleteStats) {
      return html`
        <level-complete-modal
          .stats=${this.levelCompleteStats}
          .hasNextLevel=${this.levelCompleteStats.hasNextLevel}
          .hasPreviousLevel=${this.levelCompleteStats.hasPreviousLevel}
          .fontRenderer=${this.fontRenderer}
          @next-level=${() => this._handleLevelAction('next')}
          @restart-level=${() => this._handleLevelAction('restart')}
          @previous-level=${() => this._handleLevelAction('previous')}
        ></level-complete-modal>
      `;
    }

    // FIX: Reworked rendering logic for the main menu and modals
    // If the game has NOT started, render the main menu screen.
    // Any active modal will be rendered on top of it.
    if (!this.gameHasStarted) {
      return html`
        <div class="main-menu-overlay">
          ${this.activeModal === 'main-menu'
            ? this.renderMainMenuContent()
            : this.renderActiveModal()
          }
        </div>
      `;
    }
    
    // If the game HAS started, only render the active modal (without the main menu background).
    return this.renderActiveModal();
  }
  
  // FIX: Created a new method for just the main menu's content.
  renderMainMenuContent() {
    const buttonTexts = [
      { text: 'Start Game', action: () => eventBus.publish('requestStartGame') },
      { text: 'Levels', action: () => this._openModalFromMenu('levels') },
      { text: 'Character', action: () => this._openModalFromMenu('character') },
      { text: 'Settings', action: () => this._openModalFromMenu('settings') },
      { text: 'Stats', action: () => this._openModalFromMenu('stats') }
    ];

    return html`
      <div class="main-menu-container">
        <bitmap-text
          .fontRenderer=${this.fontRenderer} text="Parkour Hero" scale="9" outlineColor="black" outlineWidth="2"
        ></bitmap-text>
        <div class="main-menu-buttons">
          ${buttonTexts.map(btn => html`
            <button @click=${btn.action}>
              <bitmap-text .fontRenderer=${this.fontRenderer} text=${btn.text} scale="2.5" outlineColor="#004a99" outlineWidth="1"></bitmap-text>
            </button>
          `)}
        </div>
      </div>
    `;
  }
  
  renderActiveModal() {
    switch (this.activeModal) {
      case 'settings':
        return html`<settings-menu 
                      .keybinds=${this.keybinds} .soundSettings=${this.soundSettings} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @keybind-changed=${this._handleKeybindChange}
                    ></settings-menu>`;
      case 'pause':
        return html`<pause-modal
                      .stats=${this.currentStats} .fontRenderer=${this.fontRenderer}
                      @resume-game=${this._closeModal} @restart-level=${this._handleRestart} @open-levels-menu=${this._handleOpenLevelsMenu}
                    ></pause-modal>`;
      case 'levels':
        return html`<levels-menu
                      .gameState=${this.gameState} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @level-selected=${this._handleLevelSelected}
                    ></levels-menu>`;
      case 'character':
        return html`<character-menu
                      .gameState=${this.gameState} .assets=${this.assets} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @character-selected=${this._handleCharacterSelected}
                    ></character-menu>`;
      case 'info':
        return html`<info-modal
                      .keybinds=${this.keybinds}
                      .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal}
                    ></info-modal>`;
      case 'stats':
        return html`<stats-modal
                      .gameState=${this.gameState}
                      .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal}
                    ></stats-modal>`;
      default:
        return html``;
    }
  }
}

customElements.define('parkour-hero-ui', ParkourHeroUI);