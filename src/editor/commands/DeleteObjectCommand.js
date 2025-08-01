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
        // Re-add the object. Assumes objectManager.objects is accessible.
        this.objectManager.objects.push(this.deletedObject);
        this.objectManager.render();
    }
}