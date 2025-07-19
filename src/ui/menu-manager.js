import { eventBus } from '../utils/event-bus.js';
import { SettingsMenu } from './settings-menu.js';
import { LevelMenu } from './level-menu.js';
import { CharacterMenu } from './character-menu.js';
import { MainMenu } from './main-menu.js';
import { formatTime, formatKeyForDisplay } from './ui-utils.js';

export class MenuManager {
  constructor(assets, gameState, keybinds, fontRenderer) {
    this.assets = assets;
    this.gameState = gameState;
    this.keybinds = keybinds;
    this.fontRenderer = fontRenderer;
    this.levelManager = null;
    this.isGameRunning = false;
    this.isPausedForMenu = false;
    this.gameHasStarted = false;

    // --- Instantiate Menu Handlers ---
    this.mainMenu = new MainMenu(this.fontRenderer);
    this.settingsMenu = new SettingsMenu(this.keybinds, this.fontRenderer);
    this.levelMenu = new LevelMenu(this.gameState, this.fontRenderer);
    this.characterMenu = new CharacterMenu(this.gameState, this.assets, this.fontRenderer);

    // --- DOM Element Queries for Modals and Top-Level Buttons ---
    this.settingsModal = document.getElementById('settingsModal');
    this.levelsMenuModal = document.getElementById('levelsMenuModal');
    this.characterModal = document.getElementById('characterModal');
    this.pauseModal = document.getElementById('pauseModal');
    this.levelCompleteModal = document.getElementById('levelCompleteModal');
    this.infoModal = document.getElementById('infoModal');

    this.allModals = [this.settingsModal, this.levelsMenuModal, this.characterModal, this.pauseModal, this.levelCompleteModal, this.infoModal];

    this.settingsButton = document.getElementById('settingsButton');
    this.pauseButton = document.getElementById('pauseButton');
    this.levelsMenuButton = document.getElementById('levelsMenuButton');
    this.characterButton = document.getElementById('characterButton');
    this.infoButton = document.getElementById('infoButton');

    // Pause Modal Elements
    this.pauseResumeButton = document.getElementById('pause-resume-button');
    this.pauseRestartButton = document.getElementById('pause-restart-button');
    this.pauseMainMenuButton = document.getElementById('pause-main-menu-button');
    this.pauseStatsFruits = document.getElementById('pause-stats-fruits');
    this.pauseStatsDeaths = document.getElementById('pause-stats-deaths');
    this.pauseStatsTime = document.getElementById('pause-stats-time');

    // Level Complete Modal Elements
    this.lcTitle = document.getElementById('level-complete-title');
    this.lcDeaths = document.getElementById('level-complete-deaths');
    this.lcTime = document.getElementById('level-complete-time');
    this.lcPreviousButton = document.getElementById('lc-previous-button');
    this.lcRestartButton = document.getElementById('lc-restart-button');
    this.lcNextButton = document.getElementById('lc-next-button');
  }
  
  _renderToElement(element, text, options) {
      if (!element || !this.fontRenderer) return;
      element.innerHTML = '';
      const canvas = this.fontRenderer.renderTextToCanvas(text, options);
      if (canvas) {
          canvas.style.imageRendering = 'pixelated';
          element.appendChild(canvas);
      }
  }

  _renderStaticModalText() {
    // Pause Modal
    this._renderToElement(document.getElementById('pause-title'), 'Game Paused', { scale: 3, color: 'white', outlineColor: 'black', outlineWidth: 1 });
    this._renderToElement(document.getElementById('pause-subtitle'), 'Press ESC to resume', { scale: 1.5, color: '#ccc' });
    
    // Info Modal
    this._renderToElement(document.getElementById('info-title'), 'Info Section', { scale: 3, color: 'white', outlineColor: 'black', outlineWidth: 1 });
    this._renderToElement(document.getElementById('info-subtitle'), 'How to Play', { scale: 2, color: 'white', outlineColor: 'black', outlineWidth: 1 });
    this._renderToElement(document.getElementById('htp-pause'), 'ESC', { scale: 1.5, color: 'white' });
    
    // Manual text wrapping for "How to Play" paragraphs
    const htpLine1 = document.getElementById('htp-line-1');
    const line1Text = ["Use the controls to navigate the world,", "collect all the fruit, and reach the trophy!"];
    line1Text.forEach(line => this._renderToElement(htpLine1, line, { scale: 1.5, color: '#eee' }));

    const htpLine2 = document.getElementById('htp-line-2');
    const line2Text = ["You can also jump off of most walls! While in the air,", "move against a wall to slide down it, then press", "the jump key again to wall jump away."];
    line2Text.forEach(line => this._renderToElement(htpLine2, line, { scale: 1.5, color: '#eee' }));

    const htpLine3 = document.getElementById('htp-line-3');
    const line3Text = ["Note: You cannot cling to natural surfaces", "like dirt, sand, mud, or ice."];
    line3Text.forEach(line => this._renderToElement(htpLine3, line, { scale: 1.5, color: '#eee' }));
  }


  setLevelManager(levelManager) { 
    this.levelManager = levelManager;
  }

  init() {
    this.mainMenu.init();
    this._setupEventListeners();
    this._setupEventSubscriptions();
    this.updateHowToPlayKeyDisplays();
    this._renderStaticModalText();
  }
  
  _setupEventSubscriptions() {
      eventBus.subscribe('gameStarted', () => {
          this.isGameRunning = true;
          this.gameHasStarted = true;
      });
      eventBus.subscribe('gamePaused', () => {
          this.isGameRunning = false;
          this.updatePauseButtonIcon();
      });
      eventBus.subscribe('gameResumed', () => {
          this.isGameRunning = true;
          this.isPausedForMenu = false;
          this.updatePauseButtonIcon();
      });
      eventBus.subscribe('levelComplete', ({ deaths, time }) => {
          this.showLevelCompleteScreen(deaths, time);
      });
      eventBus.subscribe('levelLoaded', ({ gameState }) => {
          this.gameState = gameState;
          this.allModals.forEach(m => m.classList.add('hidden'));
      });
      eventBus.subscribe('statsUpdated', (stats) => {
          this.updatePauseModalStats(stats);
      });
      eventBus.subscribe('gameStateUpdated', (gameState) => {
          this.gameState = gameState;
          // Sub-menus will listen for this event themselves
      });
      eventBus.subscribe('keybindsUpdated', () => {
          this.updateHowToPlayKeyDisplays();
      });
      eventBus.subscribe('requestModalOpen', ({ modal }) => {
          this.mainMenu.hide();
          switch (modal) {
              case 'levels':
                  this.toggleModal(this.levelsMenuModal, () => this.levelMenu.show());
                  break;
              case 'character':
                  this.toggleModal(this.characterModal, () => this.characterMenu.show(), () => this.characterMenu.hide());
                  break;
              case 'settings':
                  this.toggleModal(this.settingsModal, () => this.settingsMenu.show());
                  break;
          }
      });
  }

  _setupEventListeners() {
    // Top-level UI buttons now delegate to sub-modules
    this.settingsButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
      this.toggleModal(this.settingsModal, () => this.settingsMenu.show());
    });
    this.levelsMenuButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
      this.toggleModal(this.levelsMenuModal, () => this.levelMenu.show());
    });
    this.characterButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
      this.toggleModal(this.characterModal, () => this.characterMenu.show(), () => this.characterMenu.hide());
    });
    this.infoButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
      this.toggleModal(this.infoModal, () => this.updateHowToPlayKeyDisplays());
    });

    // Special handler for the Pause/Resume button
    this.pauseButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
      if (this.pauseButton.classList.contains('is-paused')) {
        const openModal = this.allModals.find(m => !m.classList.contains('hidden'));
        if (openModal) {
          this.toggleModal(openModal, null, openModal === this.characterModal ? () => this.characterMenu.hide() : null);
        } else {
          if (!this.gameState.showingLevelComplete) {
            eventBus.publish('requestResume');
          }
        }
      } else {
        this.toggleModal(this.pauseModal);
      }
    });

    // Modal close buttons (the 'X' in the corner)
    this.allModals.forEach(modal => {
        const closeButton = modal.querySelector('.close-button');
        if (closeButton) {
            const onClose = modal === this.characterModal ? () => this.characterMenu.hide() : null;
            closeButton.addEventListener('click', () => {
                eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
                this.toggleModal(modal, null, onClose);
            });
        }
    });

    // Pause Modal listeners
    this.pauseResumeButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
      this.toggleModal(this.pauseModal);
    });
    this.pauseRestartButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
      eventBus.publish('requestLevelRestart');
    });
    this.pauseMainMenuButton.addEventListener('click', () => {
        eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
        this.toggleModal(this.pauseModal);
        this.toggleModal(this.levelsMenuModal, () => this.levelMenu.show());
    });

    // Level Complete listeners
    this.lcPreviousButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
      this.handleLevelCompleteAction('previous');
    });
    this.lcRestartButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
      this.handleLevelCompleteAction('restart');
    });
    this.lcNextButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
      this.handleLevelCompleteAction('next');
    });
  }

  isModalOpen() {
    return this.allModals.some(m => !m.classList.contains('hidden'));
  }

  toggleModal(modal, onOpen, onClose) {
    if (!modal) return;
    const isOpening = modal.classList.contains('hidden');

    if (isOpening) {
      const anyModalAlreadyOpen = this.isModalOpen();
      this.allModals.forEach(m => {
        if (m !== modal && !m.classList.contains('hidden') && m === this.characterModal) {
          this.characterMenu.hide();
        }
        
        m.classList.toggle('hidden', m !== modal);
      });
      
      if (onOpen) onOpen();

      if (!anyModalAlreadyOpen) {
        this.isPausedForMenu = true;
        eventBus.publish('menuOpened');
        if (this.isGameRunning) {
          eventBus.publish('requestPause');
        }
      }
    } else {
      modal.classList.add('hidden');
      if (onClose) onClose();

      if (!this.isModalOpen()) {
        this.isPausedForMenu = false;
        eventBus.publish('allMenusClosed');
        if (!this.gameHasStarted) {
            this.mainMenu.show();
        } else if (!this.gameState.showingLevelComplete) {
          eventBus.publish('requestResume');
        }
      }
    }
  }

  handleEscape() {
      const openModal = this.allModals.find(m => !m.classList.contains('hidden'));
      if (openModal) {
          const onClose = openModal === this.characterModal ? () => this.characterMenu.hide() : null;
          this.toggleModal(openModal, null, onClose);
      } else if (this.isGameRunning && !this.gameState.showingLevelComplete) {
          this.toggleModal(this.pauseModal);
      }
  }

  showLevelCompleteScreen(deaths, time) {
      this.allModals.forEach(m => m.classList.add('hidden'));
      this._renderToElement(this.lcTitle, 'Level Complete!', { scale: 3, color: 'white', outlineColor: 'black', outlineWidth: 1 });
      this._renderToElement(this.lcDeaths, `Deaths: ${deaths}`, { scale: 1.8, color: 'white' });
      this._renderToElement(this.lcTime, formatTime(time), { scale: 1.8, color: 'white' });

      if (this.levelManager) {
        this.lcNextButton.style.display = this.levelManager.hasNextLevel() ? 'inline-block' : 'none';
        this.lcPreviousButton.style.display = this.levelManager.hasPreviousLevel() ? 'inline-block' : 'none';
      }

      this.levelCompleteModal.classList.remove('hidden');
  }
  
  handleLevelCompleteAction(action) {
      if (this.levelCompleteModal.classList.contains('hidden')) return;
      this.levelCompleteModal.classList.add('hidden');
      if (this.levelManager) { 
        this.levelManager.handleLevelCompleteAction(action);
      }
  }

  updatePauseButtonIcon() {
    if (this.isGameRunning) {
        this.pauseButton.classList.remove('is-paused');
        this.pauseButton.setAttribute('aria-label', 'Pause');
    } else {
        this.pauseButton.classList.add('is-paused');
        this.pauseButton.setAttribute('aria-label', 'Resume');
    }
  }
  
  updatePauseModalStats({ collectedFruits, totalFruits, deathCount, levelTime }) {
    this._renderToElement(this.pauseStatsFruits, `Fruits: ${collectedFruits} / ${totalFruits}`, { scale: 1.8, color: 'white' });
    this._renderToElement(this.pauseStatsDeaths, `Deaths: ${deathCount || 0}`, { scale: 1.8, color: 'white' });
    this._renderToElement(this.pauseStatsTime, `Time: ${formatTime(levelTime)}`, { scale: 1.8, color: 'white' });
  }
  
  updateHowToPlayKeyDisplays() {
      try {
          const options = { scale: 1.5, color: 'white' };
          this._renderToElement(document.getElementById('htp-left'), formatKeyForDisplay(this.keybinds.moveLeft), options);
          this._renderToElement(document.getElementById('htp-right'), formatKeyForDisplay(this.keybinds.moveRight), options);
          this._renderToElement(document.getElementById('htp-jump'), formatKeyForDisplay(this.keybinds.jump), options);
          this._renderToElement(document.getElementById('htp-dash'), formatKeyForDisplay(this.keybinds.dash), options);
      } catch (error) {
          console.warn("Could not update 'How to Play' key displays.", error);
      }
  }

  // --- Facade methods for InputManager ---
  isRemapping() {
      return this.settingsMenu.isRemapping();
  }

  setKeybind(e) {
      if (this.isRemapping()) {
          this.settingsMenu.setKeybind(e);
      }
  }
}