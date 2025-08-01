import { Tool } from './Tool.js';
import { PlaceObjectCommand } from '../commands/PlaceObjectCommand.js';

export class PlaceObjectTool extends Tool {
    onMouseDown(e, { pixelX, pixelY }) {
        if (e.button !== 0) return;

        const type = this.state.currentTool.id;
        const { newObject, replacedSpawn } = this.objectManager.addObject(type, pixelX, pixelY);
        
        this.history.push(new PlaceObjectCommand(this.objectManager, newObject, replacedSpawn));
        
        // Select the object and switch to the select tool for immediate manipulation
        this.context.app.selectObject(newObject.id);
        this.context.palette.selectTool('select');
    }
}