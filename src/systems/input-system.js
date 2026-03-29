import { eventBus } from '../utils/event-bus.js';
import { InputComponent } from '../components/InputComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';

export class InputSystem {
  constructor(entityManager) {
    this.entityManager = entityManager;
    this.keys = new Set();
    this.queue = [];

    this._boundKeyDown = this.handleKeyDown.bind(this);
    this._boundKeyUp = this.handleKeyUp.bind(this);
    this._boundBlur = this.handleBlur.bind(this); // Bind the blur handler
    this._boundContextMenu = (e) => e.preventDefault();

    this.initEventListeners();
  }

  initEventListeners() {
    window.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('keyup', this._boundKeyUp);
    window.addEventListener('blur', this._boundBlur); // Listen for the blur event
    window.addEventListener('contextmenu', this._boundContextMenu);
  }

  destroy() {
    window.removeEventListener('keydown', this._boundKeyDown);
    window.removeEventListener('keyup', this._boundKeyUp);
    window.removeEventListener('blur', this._boundBlur); // Clean up the blur listener
    window.removeEventListener('contextmenu', this._boundContextMenu);
  }
  
  // New handler for when the window loses focus
  handleBlur() {
    this.keys.clear();
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase();

    if (!this.keys.has(key)) {
        this.queue.push({ key, type: 'down' });
    }
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
    this.queue.push({ key, type: 'up' });
  }

  update(_dt, { keybinds, isRunning, gameState }) {
    const canProcessGameplayInput = isRunning && !gameState.showingLevelComplete;

    const entities = this.entityManager.query([PlayerControlledComponent, InputComponent]);
    for (const entityId of entities) {
        const inputComp = this.entityManager.getComponent(entityId, InputComponent);

        inputComp.moveLeft = canProcessGameplayInput && this.keys.has(keybinds.moveLeft);
        inputComp.moveRight = canProcessGameplayInput && this.keys.has(keybinds.moveRight);
        inputComp.jump = canProcessGameplayInput && this.keys.has(keybinds.jump);
        inputComp.dash = canProcessGameplayInput && this.keys.has(keybinds.dash);

        inputComp.jumpPressedThisFrame = false;
        inputComp.dashPressedThisFrame = false;
        inputComp.quickRespawnPressedThisFrame = false;
    }

    if (canProcessGameplayInput) {
        for (const event of this.queue) {
            if (event.type === 'down') {
                for (const entityId of entities) {
                    const inputComp = this.entityManager.getComponent(entityId, InputComponent);
                    if (event.key === keybinds.jump) {
                        inputComp.jumpPressedThisFrame = true;
                    }
                    if (event.key === keybinds.dash) {
                        inputComp.dashPressedThisFrame = true;
                    }
                    if (event.key === keybinds.quickRespawn) {
                        inputComp.quickRespawnPressedThisFrame = true;
                    }
                }
            }
        }
    }

    this.queue = [];
  }
}