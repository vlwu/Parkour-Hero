export class InputManager {
  constructor(engine, canvas, keybindsRef, uiElements, callbacks) {
    this.engine = engine;
    this.canvas = canvas;
    this.keybinds = keybindsRef;
    this.ui = uiElements;
    this.callbacks = callbacks;

    this.activeKeybindInput = null;
    this.audioEnabled = false;

    this.init();
  }

  init() {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Mouse/Touch events
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // UI-specific events for settings
    this.ui.keybindInputs.forEach(input => {
      input.addEventListener('click', () => this.startKeybindRemap(input));
    });

    // Audio context enabling
    this.enableAudioOnFirstInteraction();
  }

  startKeybindRemap(inputElement) {
    if (this.activeKeybindInput) {
      this.activeKeybindInput.classList.remove('active-rebind');
    }
    this.activeKeybindInput = inputElement;
    inputElement.value = 'Press a key...';
    inputElement.classList.add('active-rebind');
  }

  handleKeyDown(e) {
    if (!this.engine) return;

    const key = e.key.toLowerCase();

    // 1. Handle keybind remapping (highest priority)
    if (this.activeKeybindInput && !this.ui.settingsModal.classList.contains('hidden')) {
      e.preventDefault();
      e.stopPropagation();

      const action = this.activeKeybindInput.dataset.action;
      if ((key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) || ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key)) {
        this.keybinds[action] = key;
        this.engine.updateKeybinds(this.keybinds);
      }
      
      this.callbacks.updateKeybindDisplay();
      this.activeKeybindInput.classList.remove('active-rebind');
      this.activeKeybindInput = null;
      return;
    }

    // 2. Handle level complete screen keyboard input
    if (this.engine.gameState.showingLevelComplete) {
      let action = null;
      switch (key) {
        case 'enter':
        case ' ':
          action = this.engine.gameState.hasNextLevel() ? 'next' : 'restart';
          break;
        case 'r':
          action = 'restart';
          break;
        case 'n':
          if (this.engine.gameState.hasNextLevel()) action = 'next';
          break;
        case 'p':
          if (this.engine.gameState.hasPreviousLevel()) action = 'previous';
          break;
      }
      if (action) {
        e.preventDefault();
        this.engine.gameState.handleLevelCompleteAction(action);
      }
      return;
    }

    // 3. Handle global pause/resume key
    if (key === 'escape') {
      if (this.ui.settingsModal.classList.contains('hidden')) {
        e.preventDefault();
        if (this.engine.isRunning) {
          this.engine.pause();
        } else {
          this.engine.resume();
        }
        this.callbacks.updatePauseButtonIcon();
      }
      return;
    }

    // 4. Pass general key events to the engine
    if (!e.defaultPrevented) {
      this.engine.handleKeyEvent(key, true);
    }
  }

  handleKeyUp(e) {
    if (this.engine) {
      this.engine.handleKeyEvent(e.key.toLowerCase(), false);
    }
  }

  handleCanvasClick(e) {
    if (!this.engine) return;

    const rect = this.canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    const x = (e.clientX - rect.left) / displayWidth * this.canvas.width;
    const y = (e.clientY - rect.top) / displayHeight * this.canvas.height;

    this.engine.handleCanvasClick(x, y);
  }

  enableAudioOnFirstInteraction() {
    const enableAudio = (event) => {
      if (this.audioEnabled) return;
      
      const target = event.target;
      if (target && target.closest('.menu-button, #settingsModal')) {
        return;
      }

      if (this.engine && this.engine.soundManager) {
        this.engine.soundManager.enableAudioContext();
        console.log('Audio context enabled on user interaction');
        this.audioEnabled = true;
      }

      if (this.audioEnabled) {
        document.removeEventListener('click', enableAudio);
        document.removeEventListener('keydown', enableAudio);
        document.removeEventListener('touchstart', enableAudio);
      }
    };

    document.addEventListener('click', enableAudio, false);
    document.addEventListener('keydown', enableAudio, false);
    document.addEventListener('touchstart', enableAudio, false);
  }
}