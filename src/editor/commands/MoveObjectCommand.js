import { Command } from './Command.js';

export class MoveObjectCommand extends Command {
    constructor(objectManager, objectId, fromPos, toPos) {
        super();
        this.objectManager = objectManager;
        this.objectId = objectId;
        this.fromPos = fromPos;
        this.toPos = toPos;
    }

    _move(pos) {
        const obj = this.objectManager.getObject(this.objectId);
        if (obj) {
            obj.x = pos.x;
            obj.y = pos.y;
            this.objectManager.render();
        }
    }

    execute() {
        this._move(this.toPos);
    }

    undo() {
        this._move(this.fromPos);
    }
}