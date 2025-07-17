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
  }

  handleKeyDown(e) {
    if (!this.engine || !this.menuManager) return;

    const key = e.key.toLowerCase();
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
        this.menuManager.handleLevelCompleteAction(action);
      }
      return;
    }
    
    // 3. Handle closing/opening menus with Escape key
    if (key === 'escape') {
        e.preventDefault();
        // If any modal other than the pause modal is open, this will do nothing.
        // If only the pause modal is open, it will close it.
        // If no modal is open, it will open the pause modal.
        if (!this.menuManager.isModalOpen() || !this.menuManager.pauseModal.classList.contains('hidden')) {
            this.menuManager.togglePauseModal();
        }
        return;
    }

    // 4. Pass general key events to the engine if game is running
    if (this.engine.isRunning && !this.menuManager.isModalOpen()) {
      if (!e.defaultPrevented) {
        // Corrected line: Directly modify the engine's key state object.
        this.engine.keys[key] = true;
      }
    }
  }

  handleKeyUp(e) {
    if (this.engine) {
      // Corrected line: Directly modify the engine's key state object.
      this.engine.keys[e.key.toLowerCase()] = false;
    }
  }

  handleCanvasClick(e) {
    // This method is required to prevent a startup error, but currently has no specific functionality.
  }
}