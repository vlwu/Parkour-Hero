import { eventBus } from '../core/event-bus.js';
import { formatKeyForDisplay } from './ui-utils.js';

export class SettingsMenu {
  constructor(keybinds) {
    this.keybinds = keybinds;
    this.activeKeybindInput = null;

    // --- DOM Element Queries ---
    this.keybindInputs = document.querySelectorAll('.keybind-item input');
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
  }

  _setupEventListeners() {
    // Sound settings
    if (this.soundToggle) {
        this.soundToggle.addEventListener('click', () => {
            eventBus.publish('toggleSound');
        });
    }
    if (this.volumeSlider) {
        this.volumeSlider.addEventListener('input', (e) => {
            const volume = parseFloat(e.target.value);
            eventBus.publish('setSoundVolume', { volume });
            if (this.volumeValue) {
                this.volumeValue.textContent = `${Math.round(volume * 100)}%`;
            }
        });
    }
    if (this.testSoundButton) {
        this.testSoundButton.addEventListener('click', () => {
            eventBus.publish('playSound', { key: 'jump', volume: 0.8 });
        });
    }
    // Keybinds
    this.keybindInputs.forEach(input => {
        input.addEventListener('click', () => this.startKeybindRemap(input));
    });
  }
  
  show() {
    this.updateKeybindDisplay();
    // Sound display is updated via event subscription.
  }

  updateKeybindDisplay() {
    this.keybindInputs.forEach(input => {
        const action = input.dataset.action;
        input.value = formatKeyForDisplay(this.keybinds[action]);
    });
  }
  
  updateSoundSettingsDisplay(stats) {
      if (!stats) return;
      if (this.soundToggle) {
          this.soundToggle.textContent = stats.soundEnabled ? 'ON' : 'OFF';
          this.soundToggle.classList.toggle('sound-enabled', stats.soundEnabled);
          this.soundToggle.classList.toggle('sound-disabled', !stats.soundEnabled);
      }
      if (this.volumeSlider && this.volumeValue) {
          this.volumeSlider.value = stats.soundVolume;
          this.volumeValue.textContent = `${Math.round(stats.soundVolume * 100)}%`;
      }
      if (this.testSoundButton) {
          this.testSoundButton.disabled = !stats.soundEnabled;
      }
  }

  startKeybindRemap(inputElement) {
    if (this.activeKeybindInput) {
        this.activeKeybindInput.classList.remove('active-rebind');
        this.activeKeybindInput.value = formatKeyForDisplay(this.keybinds[this.activeKeybindInput.dataset.action]);
    }
    this.activeKeybindInput = inputElement;
    inputElement.value = 'Press a key...';
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