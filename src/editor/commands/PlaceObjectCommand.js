import { Command } from './Command.js';

export class PlaceObjectCommand extends Command {
    constructor(objectManager, newObject, replacedSpawn = null) {
        super();
        this.objectManager = objectManager;
        this.newObject = newObject;
        this.replacedSpawn = replacedSpawn;
    }

    execute() {
        if (this.replacedSpawn) {
            this.objectManager.deleteObject(this.replacedSpawn[0].id);
        }
        this.objectManager.addObjectInstance(this.newObject);
    }

    undo() {
        this.objectManager.deleteObject(this.newObject.id);
        if (this.replacedSpawn) {
            this.objectManager.addObjectInstance(this.replacedSpawn[0]);
        }
    }
}