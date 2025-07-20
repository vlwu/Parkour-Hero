import { eventBus } from '../utils/event-bus.js';

export class InputManager {
  constructor() {
    this.init();
  }

  init() {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Prevent context menu on the game itself
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase();

    // Publish a single, rich event for any system to consume.
    // It contains the simple key and the original event for complex checks (like remapping).
    eventBus.publish('key_down', { key: key, rawEvent: e });

    // Publish specific semantic events for non-polling actions.
    const menuActionMap = {
        'enter': 'confirm',
        'r': 'restart',
        'n': 'next',
        'p': 'previous',
        'escape': 'escape_pressed'
    };
    
    // The 'space' key is both a game action and a common menu confirmation.
    if (key === ' ') {
        eventBus.publish('action_confirm_pressed');
    }

    const action = menuActionMap[key];
    if (action) {
        eventBus.publish(`action_${action}`);
    }
  }

  handleKeyUp(e) {
    const key = e.key.toLowerCase();
    // Publish a rich key_up event.
    eventBus.publish('key_up', { key: key, rawEvent: e });
  }
}