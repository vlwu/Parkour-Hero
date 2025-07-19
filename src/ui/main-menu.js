import { eventBus } from '../utils/event-bus.js';

export class MainMenu {
  constructor() {
    this.mainMenuOverlay = document.getElementById('main-menu-overlay');
    this.startButton = document.getElementById('main-menu-start');
    this.levelsButton = document.getElementById('main-menu-levels');
    this.characterButton = document.getElementById('main-menu-character');
    this.settingsButton = document.getElementById('main-menu-settings');
  }

  init() {
    this.startButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
      this.hide();
      eventBus.publish('requestStartGame');
    });

    this.levelsButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
      eventBus.publish('requestModalOpen', { modal: 'levels' });
    });

    this.characterButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
      eventBus.publish('requestModalOpen', { modal: 'character' });
    });
    
    this.settingsButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
      eventBus.publish('requestModalOpen', { modal: 'settings' });
    });
  }

  hide() {
    this.mainMenuOverlay.classList.add('hidden');
  }

  show() {
    this.mainMenuOverlay.classList.remove('hidden');
  }
}