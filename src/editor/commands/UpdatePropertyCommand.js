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
        this.objectManager.updateObjectProp(this.objectId, this.prop, value);
    }

    execute() {
        this._update(this.toValue);
    }

    undo() {
        this._update(this.fromValue);
    }
}