import { DOM } from './ui/DOM.js';
import { Toolbar } from './ui/Toolbar.js';
import { HistoryManager } from './core/HistoryManager.js';
import { Grid } from './grid/Grid.js';
import { ObjectManager } from './core/ObjectManager.js';
import { GridInputHandler } from './grid/GridInputHandler.js';
import { LevelExporter } from './io/LevelExporter.js';
import { LevelImporter } from './io/LevelImporter.js';
import { assetManager } from '../managers/asset-manager.js';
import { FontRenderer } from '../ui/font-renderer.js';
import { EditorState } from './EditorState.js';
import { ToolManager } from './tools/ToolManager.js';
import { ResizeCommand } from './commands/ResizeCommand.js';
import { UIManager } from './ui/UIManager.js';
import { SelectionManager } from './core/SelectionManager.js';
import { ClipboardManager } from './core/ClipboardManager.js';
import { PreviewManager } from './core/PreviewManager.js';
import { Palette } from './ui/Palette.js';
import { PropertiesPanel } from './ui/PropertiesPanel.js';
import { GRID_CONSTANTS } from '../utils/constants.js';

/**
 * @typedef {object} EditorAppContext
 * @property {EditorState} state
 * @property {Grid} grid
 * @property {ObjectManager} objectManager
 * @property {HistoryManager} history
 * @property {Palette} palette
 * @property {PropertiesPanel} propertiesPanel
 * @property {object} assets
 * @property {FontRenderer} fontRenderer
 * @property {SelectionManager} selectionManager
 * @property {ClipboardManager} clipboardManager
 * @property {ToolManager} toolManager
 * @property {GridInputHandler} inputHandler
 * @property {EditorApp} app
 * @property {(id: number) => void} selectObject
 * @property {() => void} deselectObject
 * @property {(start: {x:number, y:number}, current: {x:number, y:number}) => void} onSelectionChange
 * @property {() => void} onSelectionEnd
 * @property {(id: number, newX: number, newY: number) => void} onObjectDrag
 */

class EditorApp {
    constructor() {
        /** @type {EditorAppContext} */
        this.context = {
            state: new EditorState(),
            grid: new Grid(28, 15),
            objectManager: new ObjectManager(this.grid),
            history: new HistoryManager(DOM.undoBtn, DOM.redoBtn),
            assets: null,
            fontRenderer: null,
            selectObject: (id) => this.uiManager.selectObject(id),
            deselectObject: () => this.uiManager.deselectObject(),
            onSelectionChange: (start, current) => this.selectionManager.onSelectionChange(start, current),
            onSelectionEnd: () => this.selectionManager.onSelectionEnd(),
            onObjectDrag: (id, newX, newY) => this._onObjectDrag(id, newX, newY),
            app: this,
        };

        this.context.palette = new Palette(this._onPaletteSelection.bind(this));
        this.context.propertiesPanel = new PropertiesPanel(this._onPropertyUpdate.bind(this));
        this.context.selectionManager = new SelectionManager(this.context);
        this.context.clipboardManager = new ClipboardManager(this.context);
        this.context.toolManager = new ToolManager(this.context);
        this.context.inputHandler = new GridInputHandler(DOM.gridContainer, this.context.grid, this.context.toolManager);
        
        this.uiManager = new UIManager(this.context);
        this.previewManager = new PreviewManager(this.context);
        
        this.editingLevelIndex = null;
    }

    init() {
        this.context.grid.generate();
        this.uiManager.init();
        Toolbar.setup({
            onNew: () => this.resetEditor(28, 15),
            onResize: () => DOM.resizeModalOverlay.style.display = 'flex',
            onFileLoad: this._onFileLoad.bind(this),
            onExport: this._onExport.bind(this),
            onTestLevel: () => this.previewManager.start(),
            onUndo: () => this.context.history.undo(),
            onRedo: () => this.context.history.redo(),
            onZoomIn: () => this.context.grid.zoom(0.1),
            onZoomOut: () => this.context.grid.zoom(-0.1),
            onCreateLevel: this._onCreateLevel.bind(this),
            onBack: this._onBack.bind(this),
            onCopySelection: () => this.context.clipboardManager.handleSelectionAction('copy'),
            onCutSelection: () => this.context.clipboardManager.handleSelectionAction('cut'),
            onDeleteSelection: () => this.context.clipboardManager.handleSelectionAction('delete'),
        });
        window.addEventListener('resize', () => this.context.grid.autoFitScale());
        window.addEventListener('keydown', (e) => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;
            if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); this.context.history.undo(); }
            if (e.ctrlKey && e.key.toLowerCase() === 'y') { e.preventDefault(); this.context.history.redo(); }
            if (e.ctrlKey && e.key.toLowerCase() === 'c') { this.context.clipboardManager.handleSelectionAction('copy'); }
            if (e.ctrlKey && e.key.toLowerCase() === 'x') { this.context.clipboardManager.handleSelectionAction('cut'); }
            if (e.ctrlKey && e.key.toLowerCase() === 'v') { this.context.clipboardManager.preparePaste(); }
            if (e.key === 'Delete') { this.context.clipboardManager.handleSelectionAction('delete'); }
            if (e.key === 'Escape') { this.uiManager._onRightClick(); }
            if (!e.ctrlKey && e.key.toLowerCase() === 'e') { this.context.palette.selectTool('eraser'); }
            if (!e.ctrlKey && e.key.toLowerCase() === 'v') { this.context.palette.selectTool('select'); }
        });
        this._onPaletteSelection({ type: 'tile', id: '1' });
        this._loadGameAssets();
        this._checkForEditMode();
        this._animationLoop(0);
    }

    async _loadGameAssets() {
        const loadingOverlay = document.getElementById('editor-loading-overlay') || document.createElement('div');
        loadingOverlay.id = 'editor-loading-overlay';
        loadingOverlay.textContent = 'Loading Game Assets...';
        if (!loadingOverlay.parentElement) document.body.appendChild(loadingOverlay);

        try {
            await assetManager.loadCoreAssets();
            await assetManager.loadGameplayAssets();
            this.context.assets = assetManager.assets;
            this.context.fontRenderer = new FontRenderer(this.context.assets.font_spritesheet);
            DOM.testLevelBtn.disabled = false;
        } catch (error) {
            console.error("Editor: Failed to load game assets.", error);
            loadingOverlay.textContent = 'Error loading assets. Preview disabled.';
            setTimeout(() => loadingOverlay.remove(), 3000);
            return;
        }
        loadingOverlay.remove();
    }
    
    _onPaletteSelection(selection) {
        this.uiManager.deselectObject();
        this.context.selectionManager.clearSelection();
        this.context.state.pastePreview = null;
        this.context.state.clipboard = null;
    
        let toolName = selection.type;
        if (selection.type === 'tile') toolName = 'paint';
        else if (selection.type === 'object' || selection.type === 'enemy') toolName = 'place';
    
        this.context.state.currentTool = { type: toolName, id: selection.id };
        this.context.toolManager.setActiveTool(toolName);
    
        if (selection.type === 'tool') {
            this.context.propertiesPanel.displayToolProperties(selection.id, { eraserSize: this.context.state.eraserSize });
            this.context.inputHandler.setCursor(selection.id === 'select' ? 'crosshair' : 'none');
        } else {
            this.context.propertiesPanel.showItemDescription(selection.type, selection.id);
            this.context.inputHandler.setCursor('crosshair');
        }
    }
    
    _onPropertyUpdate(id, prop, value, type) {
        if (id === null) {
            if (prop === 'eraserSize') { this.context.state.eraserSize = value; }
            return;
        }
        const obj = this.context.objectManager.getObject(id);
        if (!obj) return;

        if (type === 'live') {
            if (!this.objectPropChange.isChanging) {
                this.objectPropChange.isChanging = true;
                this.objectPropChange.oldValue = obj[prop];
            }
            this.context.objectManager.updateObjectProp(id, prop, value);
        } else if (type === 'final') {
            let oldValue;
            if (this.objectPropChange.isChanging) {
                oldValue = this.objectPropChange.oldValue;
                this.objectPropChange.isChanging = false;
            } else {
                oldValue = obj[prop];
            }
            const finalValue = typeof value === 'number' ? round(value) : value;
            if (oldValue !== finalValue) {
                this.context.objectManager.updateObjectProp(id, prop, finalValue);
                this.history.push(new UpdatePropertyCommand(this.context.objectManager, id, prop, oldValue, finalValue));
            } else {
                 this.context.objectManager.updateObjectProp(id, prop, finalValue);
            }
        }
    }
    
    _onObjectDrag(id, newX, newY) {
        const obj = this.context.objectManager.getObject(id);
        if (!obj) return;
        obj.x = newX;
        obj.y = newY;
        const el = DOM.gridContainer.querySelector(`.dynamic-object[data-id='${id}']`);
        if (el) {
            el.style.left = `${obj.x * GRID_CONSTANTS.TILE_SIZE - (obj.width / 2)}px`;
            el.style.top = `${obj.y * GRID_CONSTANTS.TILE_SIZE - (obj.height / 2)}px`;
        }
        this.context.propertiesPanel.displayObject(obj);
    }
    
    _performResize(newWidth, newHeight, anchor) {
        const { grid, objectManager } = this.context;
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

        this.context.history.push(new ResizeCommand(grid, objectManager, beforeState, afterState));
    }
    
    _animationLoop = (timestamp) => {
        const deltaTime = (timestamp - (this.lastTimestamp || timestamp)) / 1000;
        this.lastTimestamp = timestamp;

        this.context.grid.overlayCtx.clearRect(0, 0, this.context.grid.overlayCanvas.width, this.context.grid.overlayCanvas.height);
        this.context.selectionManager.update(deltaTime);
        this.context.selectionManager.draw();
        
        if (this.context.state.currentTool.type === 'eraser' && this.context.state.pastePreview) {
            // This will be moved later
            const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
            const ctx = this.context.grid.overlayCtx;
            const size = this.context.state.eraserSize * TILE_SIZE;
            const brushRadius = Math.floor(this.context.state.eraserSize / 2);
            const x = (this.context.state.pastePreview.gridX - brushRadius) * TILE_SIZE;
            const y = (this.context.state.pastePreview.gridY - brushRadius) * TILE_SIZE;
            ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, size, size);
        }
        if (this.context.state.currentTool.type === 'paste' && this.context.state.pastePreview) {
            this.context.clipboardManager.drawPastePreview();
        }
        requestAnimationFrame(this._animationLoop);
    }
    
    // Remaining methods (unchanged for now, to be moved or simplified later)
    resetEditor(width, height) { this.context.grid.resize(width, height); this.context.objectManager.clear(); this.context.history.clear(); this.uiManager.deselectObject(); }
    _onFileLoad(e) { /* ... */ }
    _onExport() { /* ... */ }
    _onBack() { window.location.href = 'index.html#levels'; }
    _onCreateLevel() { /* ... */ }
}

// Ugly implementation details that will be removed or moved from EditorApp in the final step.
// They are kept here for now to avoid breaking functionality during the refactor.
EditorApp.prototype._onObjectDelete = function(id) {
    const objectToDelete = this.context.objectManager.getObject(id);
    if (!objectToDelete) return;
    if (objectToDelete.type === 'player_spawn') {
        alert('The Player Spawn cannot be deleted. To move it, simply left-click and drag it to a new position.');
        return;
    }
    const command = new DeleteObjectCommand(this.context.objectManager, objectToDelete);
    command.execute(); // Manually execute because it's not part of a tool action
    this.context.history.push(command);
    if (this.context.state.selectedObject && this.context.state.selectedObject.id === id) { this.uiManager.deselectObject(); }
};
EditorApp.prototype._onFileLoad = function(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    LevelImporter.load(file, (data) => {
        if (!data.gridWidth || !data.gridHeight || !data.tileData) {
            alert('Invalid level file format.');
            return;
        }
        this.resetEditor(data.gridWidth, data.gridHeight);
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
};
EditorApp.prototype._onExport = function() { LevelExporter.export(this.context.grid, this.context.objectManager, DOM.levelNameInput.value, DOM.backgroundInput.value); };
EditorApp.prototype._onCreateLevel = function() {
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
        if (this.editingLevelIndex !== null) {
            if (this.editingLevelIndex >= 0 && this.editingLevelIndex < diyLevels.length) {
                diyLevels[this.editingLevelIndex] = levelData;
                localStorage.setItem('parkourHeroDIYLevels', JSON.stringify(diyLevels));
                alert('Level saved successfully! Returning to the main menu.');
                window.location.href = 'index.html#levels';
            } else { alert('Error: Could not find the level to update.'); }
        } else {
            diyLevels.push(levelData);
            localStorage.setItem('parkourHeroDIYLevels', JSON.stringify(diyLevels));
            alert('Level saved successfully! Returning to the main menu.');
            window.location.href = 'index.html#levels';
        }
    } catch (e) {
        console.error('Failed to save level to localStorage:', e);
        alert('Error: Could not save the level.');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    DOM.init();
    const editor = new EditorApp();
    editor.init();
});