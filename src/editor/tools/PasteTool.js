import { Tool } from './Tool.js';
import { PaintCommand } from '../commands/PaintCommand.js';
import { PlaceObjectCommand } from '../commands/PlaceObjectCommand.js';
import { CompositeCommand } from '../commands/CompositeCommand.js';
import { GRID_CONSTANTS } from '../../utils/constants.js';

export class PasteTool extends Tool {
    onMouseDown(e, { gridX, gridY }) {
        if (e.button !== 0 || !this.state.clipboard) return;

        const startX = gridX - Math.floor(this.state.clipboard.width / 2);
        const startY = gridY - Math.floor(this.state.clipboard.height / 2);
        
        const compositeCommand = new CompositeCommand();
        const paintChanges = [];

        this.state.clipboard.tiles.forEach(tile => {
            const newX = startX + tile.x;
            const newY = startY + tile.y;
            if (newX >= 0 && newX < this.grid.width && newY >= 0 && newY < this.grid.height) {
                const index = newY * this.grid.width + newX;
                const oldId = this.grid.getTileId(index);
                paintChanges.push({ index, from: oldId, to: tile.id });
                this.grid.paintCell(index, tile.id);
            }
        });

        if (paintChanges.length > 0) {
            compositeCommand.add(new PaintCommand(this.grid, paintChanges));
        }

        this.state.clipboard.objects.forEach(objData => {
            const newX = startX + objData.x;
            const newY = startY + objData.y;
            if (newX >= 0 && newX < this.grid.width && newY >= 0 && newY < this.grid.height) {
                const pixelX = newX * GRID_CONSTANTS.TILE_SIZE;
                const pixelY = newY * GRID_CONSTANTS.TILE_SIZE;
                const { newObject } = this.objectManager.addObject(objData.type, pixelX, pixelY);
                // Important: We don't use the returned newObject directly, but create a new one for the command
                const finalObject = { ...objData, id: newObject.id, x: newX, y: newY };
                
                // Immediately update the placed object with clipboard properties
                Object.assign(newObject, finalObject);

                compositeCommand.add(new PlaceObjectCommand(this.objectManager, finalObject));
            }
        });

        if (compositeCommand.commands.length > 0) {
            this.history.push(compositeCommand);
        }
        this.objectManager.render();
    }
}