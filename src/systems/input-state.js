import { eventBus } from '../utils/event-bus.js';

class InputState {
    constructor() {
        this.keys = {};
        eventBus.subscribe('key_down', ({ key }) => this.keys[key] = true);
        eventBus.subscribe('key_up', ({ key }) => this.keys[key] = false);
    }

    isKeyDown(key) {
        return !!this.keys[key];
    }
}

// Export a singleton instance to be used across the application.
export const inputState = new InputState();