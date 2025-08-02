import { Command } from './Command.js';

export class DeleteObjectCommand extends Command {
    constructor(objectManager, objectToDelete) {
        super();
        this.objectManager = objectManager;
        this.deletedObject = objectToDelete;
    }

    execute() {
        this.objectManager.deleteObject(this.deletedObject.id);
    }

    undo() {
        this.objectManager.addObjectInstance(this.deletedObject);
    }
}