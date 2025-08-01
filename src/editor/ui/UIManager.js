import { DOM } from './DOM.js';
import { LevelExporter } from '../io/LevelExporter.js';
import { LevelImporter } from '../io/LevelImporter.js';
import { ResizeCommand } from '../commands/ResizeCommand.js';
import { GRID_CONSTANTS } from '../../utils/constants.js';

export class UIManager {
    constructor(context) {
         /** @type {import('../EditorApp.js').EditorAppContext} */
        this.context = context;
    }

    init() {
        this.context.palette.populate();
        this._setupResizeModalListeners();
    }
    
    selectObject(id) {
        const obj = this.context.objectManager.getObject(id);
        if (!obj) return;
        this.deselectObject();
        this.context.state.selectedObject = obj;
        this.context.propertiesPanel.displayObject(obj);
        DOM.gridContainer.querySelector(`.dynamic-object[data-id='${obj.id}']`)?.classList.add('selected');
    }
    
    deselectObject() {
        const { state, propertiesPanel } = this.context;
        if (!state.selectedObject) return;
        
        const el = DOM.gridContainer.querySelector(`.dynamic-object[data-id='${state.selectedObject.id}']`);
        el?.classList.remove('selected');
        
        state.selectedObject = null;
        propertiesPanel.clear();
    }
    
    _onRightClick() {
        const { state, palette, propertiesPanel, selectionManager, inputHandler } = this.context;
        if (state.selection || state.currentTool.type === 'paste') {
            selectionManager.clearSelection();
            state.pastePreview = null;
            state.clipboard = null;
            palette.selectTool('select');
        } else {
            state.currentTool = { type: 'none' };
            palette.updateSelectionVisuals();
            propertiesPanel.clear();
            inputHandler.setCursor('default');
        }
    }

    handleFileLoad(e) {
        const file = e.target.files[0];
        if (!file) return;

        LevelImporter.load(file, (data) => {
            if (!data.gridWidth || !data.gridHeight || !data.tileData) {
                alert('Invalid level file format.');
                return;
            }

            this.context.app.resetEditor(data.gridWidth, data.gridHeight);
            DOM.levelNameInput.value = data.name;
            DOM.backgroundInput.value = data.background || 'background_blue';

            if (typeof data.tileData === 'string') {
                const decodedTileData = LevelImporter._decodeRLEToTileData(data.tileData, data.gridWidth, data.gridHeight);
                this.context.grid.tileData = new Array(this.context.grid.width * this.context.grid.height).fill(0);
                decodedTileData.forEach(tile => {
                    const index = tile.y * this.context.grid.width + tile.x;
                    this.context.grid.tileData[index] = parseInt(tile.id, 10);
                });
                this.context.grid.drawAllTiles();
            }
            this.context.objectManager.load(data);
            this.context.history.clear();
        });
    }

    handleExport() {
        LevelExporter.export(this.context.grid, this.context.objectManager, DOM.levelNameInput.value, DOM.backgroundInput.value);
    }
    
    handleCreateLevel() {
        const { startPos, finalEntities } = this.context.objectManager.getObjectsForExport();
        const levelData = {
            name: DOM.levelNameInput.value || 'My DIY Level',
            gridWidth: this.context.grid.width,
            gridHeight: this.context.grid.height,
            background: DOM.backgroundInput.value,
            startPosition: startPos,
            tileData: LevelExporter._encodeTileDataToRLE(this.context.grid.getTileDataForExport(), this.context.grid.width, this.context.grid.height),
            entities: finalEntities,
        };

        try {
            const diyLevelsJSON = localStorage.getItem('parkourHeroDIYLevels');
            const diyLevels = diyLevelsJSON ? JSON.parse(diyLevelsJSON) : [];

            if (this.context.app.editingLevelIndex !== null) {
                const editIndex = this.context.app.editingLevelIndex;
                if (editIndex >= 0 && editIndex < diyLevels.length) {
                    diyLevels[editIndex] = levelData;
                    localStorage.setItem('parkourHeroDIYLevels', JSON.stringify(diyLevels));
                    alert('Level saved successfully! Returning to the main menu.');
                    window.location.href = 'index.html#levels';
                } else {
                    alert('Error: Could not find the level to update.');
                }
            } else {
                diyLevels.push(levelData);
                localStorage.setItem('parkourHeroDIYLevels', JSON.stringify(diyLevels));
                alert('Level saved successfully! Returning to the main menu.');
                window.location.href = 'index.html#levels';
            }
        } catch (e) {
            console.error('Failed to save level to localStorage:', e);
            alert('Error: Could not save the level. Your browser might be blocking localStorage or the data is too large.');
        }
    }
    
    _setupResizeModalListeners() {
        DOM.cancelResizeBtn.addEventListener('click', () => {
            DOM.resizeModalOverlay.style.display = 'none';
        });

        DOM.confirmResizeBtn.addEventListener('click', () => {
            const newWidth = parseInt(DOM.newWidthInput.value);
            const newHeight = parseInt(DOM.newHeightInput.value);
            const anchor = DOM.anchorGrid.querySelector('.selected').dataset.anchor;

            if (isNaN(newWidth) || isNaN(newHeight) || newWidth <= 0 || newHeight <= 0) {
                alert("Please enter valid positive numbers for width and height.");
                return;
            }
            this._performResize(newWidth, newHeight, anchor);
            DOM.resizeModalOverlay.style.display = 'none';
        });

        DOM.anchorGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('anchor-point')) {
                DOM.anchorGrid.querySelector('.selected').classList.remove('selected');
                e.target.classList.add('selected');
            }
        });
    }

    _performResize(newWidth, newHeight, anchor) {
        const { grid, objectManager, history } = this.context;
        const oldWidth = grid.width;
        const oldHeight = grid.height;
        const oldTileData = [...grid.tileData];
        const oldObjects = JSON.parse(JSON.stringify(objectManager.getAllObjects()));

        const beforeState = { width: oldWidth, height: oldHeight, tileData: oldTileData, objects: oldObjects };

        const dx = newWidth - oldWidth;
        const dy = newHeight - oldHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (anchor.includes('right')) offsetX = -dx;
        else if (anchor.includes('center')) offsetX = -Math.floor(dx / 2);
        if (anchor.includes('bottom')) offsetY = -dy;
        else if (anchor.includes('middle')) offsetY = -Math.floor(dy / 2);

        grid.resize(newWidth, newHeight, oldTileData, anchor);
        objectManager.clear();
        oldObjects.forEach(obj => {
            const newX = obj.x + offsetX;
            const newY = obj.y + offsetY;

            if (newX >= 0 && (newX * GRID_CONSTANTS.TILE_SIZE) < (newWidth * GRID_CONSTANTS.TILE_SIZE) && newY >= 0 && (newY * GRID_CONSTANTS.TILE_SIZE) < (newHeight * GRID_CONSTANTS.TILE_SIZE)) {
                obj.x = newX;
                obj.y = newY;
                objectManager.objects.push(obj);
            }
        });
        objectManager.render();

        const afterState = {
            width: newWidth,
            height: newHeight,
            tileData: [...grid.tileData],
            objects: JSON.parse(JSON.stringify(objectManager.getAllObjects()))
        };

        history.push(new ResizeCommand(grid, objectManager, beforeState, afterState));
    }
}