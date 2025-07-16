export class InputManager {
  constructor(engine, canvas, menuManager) {
    this.engine = engine;
    this.canvas = canvas;
    this.menuManager = menuManager;

    this.init();
  }

  init() {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Mouse/Touch events
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // UI-specific events for keybinds are now handled by MenuManager.
  }

  handleKeyDown(e) {
    if (!this.engine) return;

    const key = e.key.toLowerCase();
    const isMenuOpen = this.menuManager.isModalOpen();
    const isRemapping = this.menuManager.isRemapping();
    const isLevelComplete = this.engine.gameState.showingLevelComplete;

    // 1. Handle keybind remapping (highest priority)
    if (isRemapping) {
      e.preventDefault();
      e.stopPropagation();
      this.menuManager.setKeybind(e);
      return;
    }

    // 2. Handle level complete screen keyboard input
    if (isLevelComplete) {
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

    // 3. Handle global pause/resume key (only if no menus are open)
    if (key === 'escape' && !isMenuOpen) {
      e.preventDefault();
      this.engine.isRunning ? this.engine.pause() : this.engine.resume();
      this.menuManager.updatePauseButtonIcon();
      return;
    }

    // 4. Pass general key events to the engine if game is running
    if (this.engine.isRunning && !isMenuOpen) {
      if (!e.defaultPrevented) {
        this.engine.handleKeyEvent(key, true);
      }
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
    const x = (e.clientX - rect.left) / rect.width * this.canvas.width;
    const y = (e.clientY - rect.top) / rect.height * this.canvas.height;

    this.engine.handleCanvasClick(x, y);
  }
}