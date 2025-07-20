import { LitElement, html, css } from 'lit';
import { eventBus } from '../../utils/event-bus.js';
import './settings-menu.js'; // Ensure the settings menu is imported

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
  };

  constructor() {
    super();
    this.activeModal = 'main-menu';
    this.gameHasStarted = false;
    this.keybinds = { moveLeft: 'a', moveRight: 'd', jump: 'w', dash: ' ' };
    this.soundSettings = { soundEnabled: true, soundVolume: 0.5 };
  }

  connectedCallback() {
    super.connectedCallback();
    eventBus.subscribe('requestStartGame', this._handleStartGame);
    eventBus.subscribe('soundSettingsChanged', this._handleSoundUpdate);
    eventBus.subscribe('keybindsUpdated', this._handleKeybindsUpdate);
    eventBus.subscribe('ui_button_clicked', this._handleUIButtonClick);
    eventBus.subscribe('requestModalOpen', ({ modal }) => this.activeModal = modal);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    eventBus.unsubscribe('requestStartGame', this._handleStartGame);
    eventBus.unsubscribe('soundSettingsChanged', this._handleSoundUpdate);
    eventBus.unsubscribe('keybindsUpdated', this._handleKeybindsUpdate);
    eventBus.unsubscribe('ui_button_clicked', this._handleUIButtonClick);
    eventBus.unsubscribe('requestModalOpen', ({ modal }) => this.activeModal = modal);
  }

  _handleStartGame = () => {
    this.gameHasStarted = true;
    this.activeModal = null;
    eventBus.publish('allMenusClosed');
  };

  _handleSoundUpdate = (settings) => {
    this.soundSettings = { ...settings };
  };

  _handleKeybindsUpdate = (keybinds) => {
    this.keybinds = { ...keybinds };
  }

  _handleUIButtonClick = ({ buttonId }) => {
    if (buttonId === 'pause') {
      eventBus.publish('requestTogglePause');
    } else {
      this.activeModal = buttonId;
      eventBus.publish('menuOpened');
    }
  };

  _handleKeybindChange = (e) => {
    const { action, newKey } = e.detail;
    const newKeybinds = { ...this.keybinds, [action]: newKey };
    eventBus.publish('keybindsUpdated', newKeybinds);
  };
  
  _closeModal = () => {
      this.activeModal = null;
      eventBus.publish('allMenusClosed');
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
            <button @click=${() => this.activeModal = 'levels'}>Levels</button>
            <button @click=${() => this.activeModal = 'character'}>Character</button>
            <button @click=${() => this.activeModal = 'settings'}>Settings</button>
          </div>
        </div>
      </div>
    `;
  }
  
  renderActiveModal() {
    switch (this.activeModal) {
      case 'settings':
        return html`<settings-menu 
                      .keybinds=${this.keybinds}
                      .soundSettings=${this.soundSettings}
                      @close-modal=${this._closeModal}
                      @keybind-changed=${this._handleKeybindChange}
                    ></settings-menu>`;
      case 'levels':
        // Placeholder for the next step
        return html`<div>Levels Menu (To Be Implemented) <button @click=${this._closeModal}>Close</button></div>`;
      case 'character':
        // Placeholder for the next step
        return html`<div>Character Menu (To Be Implemented) <button @click=${this._closeModal}>Close</button></div>`;
      default:
        return html``;
    }
  }
}

customElements.define('parkour-hero-ui', ParkourHeroUI);