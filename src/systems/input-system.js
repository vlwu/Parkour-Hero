import { eventBus } from '../utils/event-bus.js';
import { InputComponent } from '../components/InputComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';

export class InputSystem {
  constructor(entityManager) {
    this.entityManager = entityManager;
    this.keys = new Set();
    this.initEventListeners();
  }

  initEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    this.keys.add(key);


    const menuActionMap = {
        'enter': 'confirm',
        'r': 'restart',
        'n': 'next',
        'p': 'previous',
        'escape': 'escape_pressed'
    };


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
    this.keys.delete(key);
  }

  update(dt, { keybinds, isRunning, gameState }) {
    const canProcessGameplayInput = isRunning && !gameState.showingLevelComplete;

    const entities = this.entityManager.query([PlayerControlledComponent, InputComponent]);
    for (const entityId of entities) {
        const inputComp = this.entityManager.getComponent(entityId, InputComponent);

        inputComp.moveLeft = canProcessGameplayInput && this.keys.has(keybinds.moveLeft);
        inputComp.moveRight = canProcessGameplayInput && this.keys.has(keybinds.moveRight);
        inputComp.jump = canProcessGameplayInput && this.keys.has(keybinds.jump);
        inputComp.dash = canProcessGameplayInput && this.keys.has(keybinds.dash);
    }
  }
}