import { eventBus } from '../utils/event-bus.js';

export class MainMenu {
  constructor(fontRenderer) {
    this.fontRenderer = fontRenderer;
    this.mainMenuOverlay = document.getElementById('main-menu-overlay');
    this.startButton = document.getElementById('main-menu-start');
    this.levelsButton = document.getElementById('main-menu-levels');
    this.characterButton = document.getElementById('main-menu-character');
    this.settingsButton = document.getElementById('main-menu-settings');
  }

  init() {
    if (this.fontRenderer) {
      this.renderBitmapUI();
    }

    this.startButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
      this.hide();
      eventBus.publish('requestStartGame');
    });

    this.levelsButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
      eventBus.publish('requestModalOpen', { modal: 'levels' });
    });

    this.characterButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
      eventBus.publish('requestModalOpen', { modal: 'character' });
    });
    
    this.settingsButton.addEventListener('click', () => {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
      eventBus.publish('requestModalOpen', { modal: 'settings' });
    });
  }

  renderBitmapUI() {
    // Render Title
    const titleEl = document.querySelector('.game-title');
    if (titleEl && titleEl.textContent) {
      const text = titleEl.textContent;
      titleEl.textContent = ''; // Clear text to prevent FOUC
      const canvas = this.fontRenderer.renderTextToCanvas(text, {
          scale: 9,
          color: 'white',
          outlineColor: 'black',
          outlineWidth: 2
      });
      if (canvas) {
          canvas.style.imageRendering = 'pixelated';
          titleEl.appendChild(canvas);
      }
    }

    // Render Buttons
    document.querySelectorAll('.main-menu-buttons button').forEach(button => {
        const text = button.textContent;
        if (!text) return;
        
        button.textContent = '';
        button.style.display = 'flex';
        button.style.justifyContent = 'center';
        button.style.alignItems = 'center';
        
        const canvas = this.fontRenderer.renderTextToCanvas(text, {
            scale: 2.5,
            color: 'white',
            outlineColor: '#004a99',
            outlineWidth: 1,
        });
        
        if (canvas) {
            canvas.style.imageRendering = 'pixelated';
            button.appendChild(canvas);
        }
    });
  }

  hide() {
    this.mainMenuOverlay.classList.add('hidden');
  }

  show() {
    this.mainMenuOverlay.classList.remove('hidden');
  }
}