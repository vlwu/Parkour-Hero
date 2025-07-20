import { eventBus } from '../utils/event-bus.js';
import { formatKeyForDisplay } from './ui-utils.js';

export class SettingsMenu {
  constructor(keybinds, fontRenderer, soundManager) {
    this.keybinds = keybinds;
    this.fontRenderer = fontRenderer;
    this.soundManager = soundManager;
    this.activeKeybindInput = null;
    this.renderedHeaders = false;

    // --- DOM Element Queries ---
    this.settingsModal = document.getElementById('settingsModal');
    this.keybindInputs = document.querySelectorAll('.keybind-item .keybind-display');
    this.soundToggle = document.getElementById('soundToggle');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.volumeValue = document.getElementById('volumeValue');
    this.testSoundButton = document.getElementById('testSoundButton');
    
    this.init();
  }

  init() {
    this._setupEventListeners();
    eventBus.subscribe('soundSettingsChanged', (settings) => this.updateSoundSettingsDisplay(settings));
    eventBus.subscribe('statsUpdated', (stats) => this.updateSoundSettingsDisplay(stats));
    
    eventBus.subscribe('key_down', ({ rawEvent }) => {
        if (this.isRemapping()) {
            rawEvent.preventDefault();
            rawEvent.stopPropagation();
            this.setKeybind(rawEvent);
        }
    });
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

  renderBitmapText() {
    if (this.renderedHeaders) return;

    this.settingsModal.querySelectorAll('h2, h3').forEach(el => {
        const text = el.textContent;
        if (!text) return;
        el.textContent = '';
        const canvas = this.fontRenderer.renderTextToCanvas(text, {
            scale: el.tagName === 'H2' ? 3 : 2,
            color: 'white',
            outlineColor: 'black',
            outlineWidth: 1
        });
        if (canvas) {
            canvas.style.imageRendering = 'pixelated';
            el.appendChild(canvas);
        }
    });

    this.settingsModal.querySelectorAll('.setting-item label, .keybind-item label').forEach(el => {
        const text = el.textContent;
        if (!text) return;
        el.textContent = '';
        const canvas = this.fontRenderer.renderTextToCanvas(text, {
            scale: 1.5,
            color: '#eee',
        });
        if (canvas) {
            canvas.style.imageRendering = 'pixelated';
            el.appendChild(canvas);
        }
    });
      
    if (this.testSoundButton) {
        const text = this.testSoundButton.textContent;
        this.testSoundButton.textContent = '';
        const canvas = this.fontRenderer.renderTextToCanvas(text, { scale: 1.5, color: 'white' });
        if (canvas) {
            canvas.style.imageRendering = 'pixelated';
            this.testSoundButton.style.padding = '10px';
            this.testSoundButton.appendChild(canvas);
        }
    }
    this.renderedHeaders = true;
  }

  _setupEventListeners() {
    // Sound settings
    if (this.soundToggle) {
        this.soundToggle.addEventListener('click', () => {
            eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
            eventBus.publish('toggleSound');
        });
    }
    if (this.volumeSlider) {
        this.volumeSlider.addEventListener('input', (e) => {
            const volume = parseFloat(e.target.value);
            eventBus.publish('setSoundVolume', { volume });
        });
    }
    if (this.testSoundButton) {
        this.testSoundButton.addEventListener('click', () => {
            eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
            eventBus.publish('playSound', { key: 'jump', volume: 0.8, channel: 'UI' });
        });
    }
    // Keybinds
    this.keybindInputs.forEach(input => {
        input.addEventListener('click', () => {
            eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
            this.startKeybindRemap(input);
        });
    });
  }
  
  show() {
    if (this.fontRenderer) {
      this.renderBitmapText();
    }
    this.updateKeybindDisplay();

    if (this.soundManager) {
        this.updateSoundSettingsDisplay(this.soundManager.getSettings());
    }
  }

  updateKeybindDisplay() {
    const options = { scale: 1.5, color: 'white' };
    this.keybindInputs.forEach(input => {
        const action = input.dataset.action;
        this._renderToElement(input, formatKeyForDisplay(this.keybinds[action]), options);
    });
  }
  
  updateSoundSettingsDisplay(stats) {
      if (!stats) return;
      if (this.soundToggle) {
          const text = stats.soundEnabled ? 'ON' : 'OFF';
          this.soundToggle.classList.toggle('sound-enabled', stats.soundEnabled);
          this.soundToggle.classList.toggle('sound-disabled', !stats.soundEnabled);
          this._renderToElement(this.soundToggle, text, { scale: 1.5, color: 'white' });
      }
      if (this.volumeSlider && this.volumeValue) {
          this.volumeSlider.value = stats.soundVolume;
          this._renderToElement(this.volumeValue, `${Math.round(stats.soundVolume * 100)}%`, { scale: 1.5, color: '#4CAF50' });
      }
      if (this.testSoundButton) {
          this.testSoundButton.disabled = !stats.soundEnabled;
      }
  }

  startKeybindRemap(inputElement) {
    if (this.activeKeybindInput) {
        this.activeKeybindInput.classList.remove('active-rebind');
        const action = this.activeKeybindInput.dataset.action;
        this._renderToElement(this.activeKeybindInput, formatKeyForDisplay(this.keybinds[action]), { scale: 1.5, color: 'white' });
    }
    this.activeKeybindInput = inputElement;
    this._renderToElement(inputElement, 'Press key...', { scale: 1.5, color: 'white' });
    inputElement.classList.add('active-rebind');
  }

  isRemapping() {
      return this.activeKeybindInput !== null;
  }

  setKeybind(e) {
      if (!this.isRemapping()) return;
      
      const key = e.key.toLowerCase();
      const action = this.activeKeybindInput.dataset.action;
      const isValidKey = (key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) || ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key);

      if (isValidKey) {
          this.keybinds[action] = key;
          eventBus.publish('keybindsUpdated', this.keybinds);
      }
      
      this.activeKeybindInput.classList.remove('active-rebind');
      this.activeKeybindInput = null;
      this.updateKeybindDisplay();
  }
}