import { CompositeCommand } from '../commands/CompositeCommand.js';
import { PaintCommand } from '../commands/PaintCommand.js';
import { DeleteObjectCommand } from '../commands/DeleteObjectCommand.js';
import { PlaceObjectCommand } from '../commands/PlaceObjectCommand.js';
import { GRID_CONSTANTS } from '../../utils/constants.js';
import { TILESET_CONFIG, TILESET_CONFIG_SPECIAL, SPECIAL_TILE_ID_OFFSET } from '../../entities/tile-definitions.js';

export class ClipboardManager {
    constructor(context) {
        /** @type {import('../EditorApp.js').EditorAppContext} */
        this.context = context;
    }

    handleSelectionAction(action) {
        if (!this.context.state.selection) return;

        const sel = this.context.state.selection;
        const clipboardData = {
            width: sel.width,
            height: sel.height,
            tiles: [],
            objects: []
        };

        for (let y = 0; y < sel.height; y++) {
            for (let x = 0; x < sel.width; x++) {
                const index = (sel.y + y) * this.context.grid.width + (sel.x + x);
                const tileId = this.context.grid.getTileId(index);
                if (tileId !== '0') {
                    clipboardData.tiles.push({ x, y, id: tileId });
                }
            }
        }
        clipboardData.objects = this.context.objectManager.getAllObjects()
            .filter(obj => {
                const objGridX = obj.x;
                const objGridY = obj.y;
                return objGridX >= sel.x && objGridX < sel.x + sel.width &&
                       objGridY >= sel.y && objGridY < sel.y + sel.height;
            })
            .map(obj => ({
                ...JSON.parse(JSON.stringify(obj)),
                x: obj.x - sel.x,
                y: obj.y - sel.y
            }));

        if (action === 'copy') {
            this.context.state.clipboard = clipboardData;
            this.preparePaste();
        } else if (action === 'cut' || action === 'delete') {
            if (action === 'cut') {
                this.context.state.clipboard = clipboardData;
            }

            const composite = new CompositeCommand();
            const paintChanges = [];
            for (let y = 0; y < sel.height; y++) {
                for (let x = 0; x < sel.width; x++) {
                    const index = (sel.y + y) * this.context.grid.width + (sel.x + x);
                    const oldId = this.context.grid.getTileId(index);
                    if (oldId !== '0') {
                        paintChanges.push({ index, from: oldId, to: '0' });
                    }
                }
            }

            if (paintChanges.length > 0) {
                const paintCommand = new PaintCommand(this.context.grid, paintChanges);
                paintCommand.execute();
                composite.add(paintCommand);
            }

            clipboardData.objects.forEach(objData => {
                const originalObj = this.context.objectManager.getObject(objData.id);
                if (originalObj) {
                    const deleteCommand = new DeleteObjectCommand(this.context.objectManager, originalObj);
                    deleteCommand.execute();
                    composite.add(deleteCommand);
                }
            });

            if (composite.commands.length > 0) {
                this.context.history.push(composite);
            }
            
            this.context.selectionManager.clearSelection();
            
            if (action === 'cut') {
                this.preparePaste();
            }
        }
    }
    
    preparePaste() {
        if (!this.context.state.clipboard) return;
        this.context.state.currentTool = { type: 'paste' };
        this.context.toolManager.setActiveTool('paste');
        this.context.inputHandler.setCursor('none');
        this.context.selectionManager.clearSelection();
    }
    
    drawPastePreview() {
        const { state, grid, palette } = this.context;
        if (!state.pastePreview || !state.clipboard) return;

        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const ctx = grid.overlayCtx;
        ctx.globalAlpha = 0.6;
        const startX = (state.pastePreview.gridX - Math.floor(state.clipboard.width / 2)) * TILE_SIZE;
        const startY = (state.pastePreview.gridY - Math.floor(state.clipboard.height / 2)) * TILE_SIZE;

        for (const tile of state.clipboard.tiles) {
            const x = startX + tile.x * TILE_SIZE;
            const y = startY + tile.y * TILE_SIZE;
            const tileId = parseInt(tile.id, 10);
            
            const isSpecial = tileId > SPECIAL_TILE_ID_OFFSET;
            const sourceImage = isSpecial ? palette.specialTileset.image : palette.mainTileset.image;
            const sourceConfig = isSpecial ? TILESET_CONFIG_SPECIAL : TILESET_CONFIG;

            if (sourceImage.complete && sourceImage.naturalWidth > 0) {
                const localId = (isSpecial ? tileId - SPECIAL_TILE_ID_OFFSET : tileId) - 1;
                const sx = (localId % sourceConfig.columns) * sourceConfig.tileWidth;
                const sy = Math.floor(localId / sourceConfig.columns) * sourceConfig.tileHeight;
                ctx.drawImage(sourceImage, sx, sy, sourceConfig.tileWidth, sourceConfig.tileHeight, x, y, TILE_SIZE, TILE_SIZE);
            }
        }
        ctx.globalAlpha = 1.0;
    }
}