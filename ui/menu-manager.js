import { characterConfig } from '../entities/levels.js';

export class MenuManager {
  constructor(engine) {
    this.engine = engine;
    this.keybinds = engine.keybinds;

    // --- DOM Element Queries ---
    this.settingsModal = document.getElementById('settingsModal');
    this.levelsMenuModal = document.getElementById('levelsMenuModal');
    this.characterModal = document.getElementById('characterModal');
    this.pauseModal = document.getElementById('pauseModal');
    this.levelCompleteModal = document.getElementById('levelCompleteModal');
    this.infoModal = document.getElementById('infoModal');

    this.settingsButton = document.getElementById('settingsButton');
    this.pauseButton = document.getElementById('pauseButton');
    this.levelsMenuButton = document.getElementById('levelsMenuButton');
    this.characterButton = document.getElementById('characterButton');
    this.infoButton = document.getElementById('infoButton');

    // Modal Close Buttons
    this.closeSettingsModalButton = document.getElementById('closeModalButton');
    this.closeLevelsMenuButton = document.getElementById('closeLevelsMenuButton');
    this.closeCharacterModalButton = document.getElementById('closeCharacterModalButton');
    this.closeInfoModalButton = document.getElementById('closeInfoModalButton');

    // Settings
    this.keybindInputs = document.querySelectorAll('.keybind-item input');
    this.soundToggle = document.getElementById('soundToggle');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.volumeValue = document.getElementById('volumeValue');
    this.testSoundButton = document.getElementById('testSoundButton');

    // Level Selection
    this.levelSelectionContainer = document.getElementById('level-selection-container');
    
    // Character Selection
    this.characterSelectionContainer = document.getElementById('character-selection-container');
    
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

    // --- UI State ---
    this.activeKeybindInput = null;
    this.characterPreviewAnimationId = null;
    this.characterPreviewStates = {};
  }

  init() {
    // Top-level UI buttons
    this.settingsButton.addEventListener('click', () => this.toggleSettingsModal());
    this.pauseButton.addEventListener('click', () => this.togglePauseModal());
    this.levelsMenuButton.addEventListener('click', () => this.toggleLevelsMenuModal());
    this.characterButton.addEventListener('click', () => this.toggleCharacterModal());
    this.infoButton.addEventListener('click', () => this.toggleInfoModal());

    // Modal close buttons
    this.closeSettingsModalButton.addEventListener('click', () => this.toggleSettingsModal());
    this.closeLevelsMenuButton.addEventListener('click', () => this.toggleLevelsMenuModal());
    this.closeCharacterModalButton.addEventListener('click', () => this.toggleCharacterModal());
    this.closeInfoModalButton.addEventListener('click', () => this.toggleInfoModal());

    // Settings listeners
    this.setupSoundSettingsListeners();
    this.setupKeybindListeners();
    this.updateHowToPlayKeyDisplays();
    this.updateSoundSettingsDisplay();

    // Pause Modal listeners
    this.pauseResumeButton.addEventListener('click', () => this.togglePauseModal());
    this.pauseRestartButton.addEventListener('click', () => {
      this.togglePauseModal();
      this.engine.loadLevel(this.engine.gameState.currentSection, this.engine.gameState.currentLevelIndex);
      this.engine.resume();
    });
    this.pauseMainMenuButton.addEventListener('click', () => {
        this.pauseModal.classList.add('hidden'); // Close pause modal without resuming
        this.toggleLevelsMenuModal();
    });

    // Level Complete listeners
    this.lcPreviousButton.addEventListener('click', () => this.handleLevelCompleteAction('previous'));
    this.lcRestartButton.addEventListener('click', () => this.handleLevelCompleteAction('restart'));
    this.lcNextButton.addEventListener('click', () => this.handleLevelCompleteAction('next'));
  }

  isModalOpen() {
    return !this.settingsModal.classList.contains('hidden') ||
           !this.levelsMenuModal.classList.contains('hidden') ||
           !this.characterModal.classList.contains('hidden') ||
           !this.pauseModal.classList.contains('hidden') ||
           !this.levelCompleteModal.classList.contains('hidden') ||
           !this.infoModal.classList.contains('hidden');
  }

  isLevelsMenuOpen() {
    return !this.levelsMenuModal.classList.contains('hidden');
  }
  
  _toggleModal(modalElement, onOpen, onClose) {
      const wasOpen = !modalElement.classList.contains('hidden');
      modalElement.classList.toggle('hidden');
      const isOpen = !modalElement.classList.contains('hidden');

      if (isOpen) {
          this.engine.pauseForMenu = true;
          if (this.engine.isRunning) {
              this.engine.pause();
          }
          if (onOpen) onOpen();
      } else if (wasOpen) {
          if (!this.isModalOpen()) {
              this.engine.pauseForMenu = false;
              if (!this.engine.isRunning && !this.engine.gameState.showingLevelComplete) {
                  this.engine.resume();
              }
          }
          if (onClose) onClose();
      }
      this.updatePauseButtonIcon();
  }

  toggleSettingsModal() {
      this._toggleModal(this.settingsModal, () => {
          this.updateKeybindDisplay();
          this.updateSoundSettingsDisplay();
      });
  }

  toggleLevelsMenuModal() {
      this._toggleModal(this.levelsMenuModal, () => {
          this.populateLevelMenu();
      });
  }

  toggleInfoModal() {
      this._toggleModal(this.infoModal, () => {
          this.updateHowToPlayKeyDisplays();
      });
  }
  
  toggleCharacterModal() {
      this._toggleModal(this.characterModal, 
          () => {
              this.populateCharacterMenu();
              if (!this.characterPreviewAnimationId) {
                  this.characterPreviewAnimationId = requestAnimationFrame(t => this.animateCharacterPreviews(t));
              }
          },
          () => {
              if (this.characterPreviewAnimationId) {
                  cancelAnimationFrame(this.characterPreviewAnimationId);
                  this.characterPreviewAnimationId = null;
              }
          }
      );
  }

  togglePauseModal() {
      this._toggleModal(this.pauseModal, () => {
          const { currentLevel, player, levelTime } = this.engine;
          const collected = currentLevel.getFruitCount();
          const total = currentLevel.getTotalFruitCount();
          this.pauseStatsFruits.textContent = `Fruits: ${collected} / ${total}`;
          this.pauseStatsDeaths.textContent = `Deaths: ${player.deathCount || 0}`;
          this.pauseStatsTime.textContent = `Time: ${this.formatTime(levelTime)}`;
      });
  }
  
  showLevelCompleteScreen(deaths, time) {
      this.lcTitle.textContent = `Level Complete!`;
      this.lcDeaths.textContent = `Deaths: ${deaths}`;
      this.lcTime.textContent = `Time Taken: ${this.formatTime(time)}`;

      this.lcNextButton.style.display = this.engine.gameState.hasNextLevel() ? 'inline-block' : 'none';
      this.lcPreviousButton.style.display = this.engine.gameState.hasPreviousLevel() ? 'inline-block' : 'none';

      this.levelCompleteModal.classList.remove('hidden');
  }
  
  handleLevelCompleteAction(action) {
      if (this.levelCompleteModal.classList.contains('hidden')) return;

      this.levelCompleteModal.classList.add('hidden');
      this.engine.gameState.handleLevelCompleteAction(action);
  }

  updatePauseButtonIcon() {
    // The pause button icon should reflect the *game loop's* state, not menu visibility
    if (this.engine.isRunning) {
        this.pauseButton.classList.remove('is-paused');
        this.pauseButton.setAttribute('aria-label', 'Pause');
    } else {
        this.pauseButton.classList.add('is-paused');
        this.pauseButton.setAttribute('aria-label', 'Resume');
    }
  }
  
  formatKeyForDisplay(key) {
    if (key === ' ') return 'SPACE';
    if (key.startsWith('arrow')) return key.replace('arrow', '').toUpperCase();
    return key.toUpperCase();
  }
  
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const wholeSeconds = Math.floor(remainingSeconds);
    const milliseconds = Math.floor((remainingSeconds - wholeSeconds) * 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${wholeSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  updateKeybindDisplay() {
    this.keybindInputs.forEach(input => {
        const action = input.dataset.action;
        input.value = this.formatKeyForDisplay(this.keybinds[action]);
    });
    this.updateHowToPlayKeyDisplays();
  }
  
  updateHowToPlayKeyDisplays() {
      try {
          document.getElementById('htp-left').textContent = this.formatKeyForDisplay(this.keybinds.moveLeft);
          document.getElementById('htp-right').textContent = this.formatKeyForDisplay(this.keybinds.moveRight);
          document.getElementById('htp-jump').textContent = this.formatKeyForDisplay(this.keybinds.jump);
          document.getElementById('htp-dash').textContent = this.formatKeyForDisplay(this.keybinds.dash);
      } catch (error) {
          console.warn("Could not update 'How to Play' key displays.", error);
      }
  }

  updateSoundSettingsDisplay() {
      if (!this.engine.soundManager) return;
      const settings = this.engine.soundManager.getSettings();
      if (this.soundToggle) {
          this.soundToggle.textContent = settings.enabled ? 'ON' : 'OFF';
          this.soundToggle.classList.toggle('sound-enabled', settings.enabled);
          this.soundToggle.classList.toggle('sound-disabled', !settings.enabled);
      }
      if (this.volumeSlider && this.volumeValue) {
          this.volumeSlider.value = settings.volume;
          this.volumeValue.textContent = `${Math.round(settings.volume * 100)}%`;
      }
      if (this.testSoundButton) {
          this.testSoundButton.disabled = !settings.enabled;
      }
  }

  populateLevelMenu() {
      this.levelSelectionContainer.innerHTML = '';
      const gameState = this.engine.gameState;

      gameState.levelSections.forEach((section, sectionIndex) => {
          const sectionContainer = document.createElement('div');
          sectionContainer.classList.add('level-section-menu');
          const sectionTitle = document.createElement('h4');
          sectionTitle.textContent = section.name;
          sectionContainer.appendChild(sectionTitle);
          const levelGrid = document.createElement('div');
          levelGrid.classList.add('level-grid');
          
          section.levels.forEach((_, levelIndex) => {
              const button = document.createElement('button');
              button.textContent = `${levelIndex + 1}`;
              button.classList.add('level-button');
              const isUnlocked = gameState.isLevelUnlocked(sectionIndex, levelIndex);
              
              if (isUnlocked) {
                  if (gameState.isLevelCompleted(sectionIndex, levelIndex)) button.classList.add('completed');
                  if (gameState.currentSection === sectionIndex && gameState.currentLevelIndex === levelIndex) button.classList.add('current');
                  button.addEventListener('click', () => {
                      this.engine.loadLevel(sectionIndex, levelIndex);
                      this.toggleLevelsMenuModal();
                  });
              } else {
                  button.classList.add('locked');
                  button.disabled = true;
                  button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"></path></svg>`;
              }
              levelGrid.appendChild(button);
          });
          sectionContainer.appendChild(levelGrid);
          this.levelSelectionContainer.appendChild(sectionContainer);
      });
  }

  populateCharacterMenu() {
    this.characterSelectionContainer.innerHTML = ''; 
    const availableCharacters = Object.keys(this.engine.assets.characters);
    const gameState = this.engine.gameState;

    availableCharacters.forEach(charId => {
        const card = document.createElement('div');
        card.className = 'character-card';
        const isUnlocked = gameState.isCharacterUnlocked(charId);
        const isSelected = gameState.selectedCharacter === charId;
        
        if (!isUnlocked) card.classList.add('locked');
        if (isSelected) card.classList.add('selected');

        const charNameFormatted = charId.replace(/([A-Z])/g, ' $1').trim();
        const config = characterConfig[charId];
        const unlockText = isUnlocked ? 'Available' : `Complete ${config.unlockRequirement} levels to unlock`;
        let buttonContent = isSelected ? 'Selected' : 'Select';
        if (!isUnlocked) {
            buttonContent = `<svg class="lock-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"></path></svg> Locked`;
        }

        card.innerHTML = `
            <canvas class="char-canvas" data-char-id="${charId}" width="64" height="64"></canvas>
            <div class="char-name">${charNameFormatted}</div>
            <div class="char-unlock">${unlockText}</div>
            <button class="action-button select-button">${buttonContent}</button>
        `;
        const selectButton = card.querySelector('.select-button');
        if (!isUnlocked) {
            selectButton.disabled = true;
        } else {
            selectButton.addEventListener('click', () => {
                if (isSelected) return;
                gameState.setSelectedCharacter(charId);
                this.engine.updatePlayerCharacter();
                this.populateCharacterMenu();
            });
        }
        this.characterSelectionContainer.appendChild(card);
    });
  }
  
  animateCharacterPreviews(timestamp) {
    if (this.characterModal.classList.contains('hidden')) {
        if (this.characterPreviewAnimationId) {
            cancelAnimationFrame(this.characterPreviewAnimationId);
            this.characterPreviewAnimationId = null;
        }
        return;
    }
    const previewCanvases = this.characterSelectionContainer.querySelectorAll('.char-canvas');
    previewCanvases.forEach(canvas => {
        const charId = canvas.dataset.charId;
        if (!charId) return;
        if (!this.characterPreviewStates[charId]) {
            this.characterPreviewStates[charId] = { frame: 0, timer: 0, lastTime: timestamp };
        }
        const state = this.characterPreviewStates[charId];
        const idleSprite = this.engine.assets.characters[charId]?.playerIdle;
        const ctx = canvas.getContext('2d');
        if (!idleSprite || !ctx) return;
        const deltaTime = (timestamp - state.lastTime) / 1000;
        state.lastTime = timestamp;
        state.timer += deltaTime;
        const animationSpeed = 0.08, frameCount = 11, frameWidth = idleSprite.width / frameCount;
        if (state.timer >= animationSpeed) {
            state.timer = 0;
            state.frame = (state.frame + 1) % frameCount;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(idleSprite, state.frame * frameWidth, 0, frameWidth, idleSprite.height, 0, 0, canvas.width, canvas.height);
    });
    this.characterPreviewAnimationId = requestAnimationFrame(t => this.animateCharacterPreviews(t));
  }

  setupSoundSettingsListeners() {
      if (this.soundToggle) {
          this.soundToggle.addEventListener('click', () => {
              this.engine.soundManager.toggleSound();
              this.updateSoundSettingsDisplay();
          });
      }
      if (this.volumeSlider) {
          this.volumeSlider.addEventListener('input', (e) => {
              const volume = parseFloat(e.target.value);
              this.engine.soundManager.setVolume(volume);
              this.updateSoundSettingsDisplay();
          });
      }
      if (this.testSoundButton) {
          this.testSoundButton.addEventListener('click', () => {
              this.engine.soundManager.play('jump', 0.8);
          });
      }
  }

  setupKeybindListeners() {
    this.keybindInputs.forEach(input => {
        input.addEventListener('click', () => this.startKeybindRemap(input));
    });
  }

  startKeybindRemap(inputElement) {
    if (this.activeKeybindInput) {
        this.activeKeybindInput.classList.remove('active-rebind');
        this.activeKeybindInput.value = this.formatKeyForDisplay(this.keybinds[this.activeKeybindInput.dataset.action]);
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
          this.engine.updateKeybinds(this.keybinds);
      }
      
      this.activeKeybindInput.classList.remove('active-rebind');
      this.activeKeybindInput = null;
      this.updateKeybindDisplay();
  }
}