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
        this.objectManager.objects.push(this.newObject);
        this.objectManager.render();
    }

    undo() {
        this.objectManager.deleteObject(this.newObject.id);
        if (this.replacedSpawn) {
            this.objectManager.objects.push(this.replacedSpawn[0]);
            this.objectManager.render();
        }
    }
}