import { eventBus } from '../utils/event-bus.js';

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
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handleKeyDown(e) {
    if (!this.engine || !this.menuManager) return;

    const key = e.key.toLowerCase();

    // 1. Handle keybind remapping (highest priority)
    if (this.menuManager.isRemapping()) {
      e.preventDefault();
      e.stopPropagation();
      this.menuManager.setKeybind(e);
      return;
    }

    // 2. Handle Escape key for all menu interactions (this is a global UI concern)
    if (key === 'escape') {
        e.preventDefault();
        this.menuManager.handleEscape();
        return;
    }

    // 3. Publish discrete action events for non-gameplay keys.
    // The engine will subscribe and decide what to do based on game state.
    const menuActionMap = {
        'enter': 'confirm',
        'r': 'restart',
        'n': 'next',
        'p': 'previous',
    };
    
    // The space bar is special, as it's a game action (dash) and can be a menu action (confirm).
    // We publish the event, and the engine will decide how to use it based on context.
    if (key === ' ') {
        eventBus.publish('action_confirm_pressed');
    }

    const action = menuActionMap[key];
    if (action) {
        eventBus.publish(`action_${action}_pressed`);
    }
    
    // 4. Update the engine's key state for polling-based input (movement, jumping, dashing).
    // The engine's update loop will check if the game is in a state to accept these inputs.
    this.engine.keys[key] = true;
  }

  handleKeyUp(e) {
    if (this.engine) {
      this.engine.keys[e.key.toLowerCase()] = false;
    }
  }

  _getMousePos(e) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
      };
  }

  handleMouseMove(e) {
      if (!this.engine) return;
      const { x, y } = this._getMousePos(e);
      this.engine.handleMouseMove(x, y);
  }

  handleCanvasClick(e) {
      if (!this.engine) return;
      const { x, y } = this._getMousePos(e);
      this.engine.handleCanvasClick(x, y);
  }
}