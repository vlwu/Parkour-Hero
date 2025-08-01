import { Command } from './Command.js';

export class UpdatePropertyCommand extends Command {
    constructor(objectManager, objectId, prop, fromValue, toValue) {
        super();
        this.objectManager = objectManager;
        this.objectId = objectId;
        this.prop = prop;
        this.fromValue = fromValue;
        this.toValue = toValue;
    }

    _update(value) {
        const obj = this.objectManager.getObject(this.objectId);
        if (obj) {
            obj[this.prop] = value;
            this.objectManager.render();
            // Note: This won't update the properties panel if the object is selected.
            // This will be addressed in a future refactoring step (UIManager).
        }
    }

    execute() {
        this._update(this.toValue);
    }

    undo() {
        this._update(this.fromValue);
    }
}