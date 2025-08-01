import { DOM } from './ui/DOM.js';
import { Toolbar } from './ui/Toolbar.js';
import { HistoryManager } from './core/HistoryManager.js';
import { Grid } from './grid/Grid.js';
import { ObjectManager } from './core/ObjectManager.js';
import { GridInputHandler } from './grid/GridInputHandler.js';
import { LevelImporter } from './io/LevelImporter.js';
import { assetManager } from '../managers/asset-manager.js';
import { FontRenderer } from '../ui/font-renderer.js';
import { EditorState } from './EditorState.js';
import { ToolManager } from './tools/ToolManager.js';
import { UIManager } from './ui/UIManager.js';
import { SelectionManager } from './core/SelectionManager.js';
import { ClipboardManager } from './core/ClipboardManager.js';
import { PreviewManager } from './core/PreviewManager.js';
import { Palette } from './ui/Palette.js';
import { PropertiesPanel } from './ui/PropertiesPanel.js';
import { KeyboardManager } from './core/KeyboardManager.js';
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
 * @property {UIManager} uiManager
 * @property {EditorApp} app
 * @property {(id: number) => void} selectObject
 * @property {() => void} deselectObject
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
            app: this,
        };

        // Instantiate managers that depend on the core context
        this.context.palette = new Palette(this._onPaletteSelection.bind(this));
        this.context.propertiesPanel = new PropertiesPanel(this._onPropertyUpdate.bind(this));
        this.context.selectionManager = new SelectionManager(this.context);
        this.context.clipboardManager = new ClipboardManager(this.context);
        this.context.toolManager = new ToolManager(this.context);
        this.context.uiManager = new UIManager(this.context);
        this.context.inputHandler = new GridInputHandler(DOM.gridContainer, this.context.grid, this.context.toolManager, this.context.uiManager);
        
        this.previewManager = new PreviewManager(this.context);
        this.keyboardManager = new KeyboardManager(this.context);
        
        this.editingLevelIndex = null;
        this.lastTimestamp = 0;
    }

    async init() {
        this.context.grid.generate();
        this.uiManager.init();
        this.keyboardManager.init();

        Toolbar.setup({
            onNew: () => this.resetEditor(28, 15),
            onResize: () => DOM.resizeModalOverlay.style.display = 'flex',
            onFileLoad: (e) => this.uiManager.handleFileLoad(e),
            onExport: () => this.uiManager.handleExport(),
            onTestLevel: () => this.previewManager.start(),
            onUndo: () => this.context.history.undo(),
            onRedo: () => this.context.history.redo(),
            onZoomIn: () => this.context.grid.zoom(0.1),
            onZoomOut: () => this.context.grid.zoom(-0.1),
            onCreateLevel: () => this.uiManager.handleCreateLevel(),
            onBack: () => { window.location.href = 'index.html#levels'; },
            onCopySelection: () => this.context.clipboardManager.handleSelectionAction('copy'),
            onCutSelection: () => this.context.clipboardManager.handleSelectionAction('cut'),
            onDeleteSelection: () => this.context.clipboardManager.handleSelectionAction('delete'),
        });
        
        window.addEventListener('resize', () => this.context.grid.autoFitScale());
        
        this._onPaletteSelection({ type: 'tile', id: '1' });
        await this._loadGameAssets();
        this._checkForEditMode();
        
        requestAnimationFrame(this._animationLoop);
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
        this.context.uiManager.deselectObject();
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
        // ... (This method will be moved to UIManager in a deeper refactor, but is fine here for now)
        // ... (Implementation remains the same)
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

    _animationLoop = (timestamp) => {
        const deltaTime = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;

        this.context.grid.overlayCtx.clearRect(0, 0, this.context.grid.overlayCanvas.width, this.context.grid.overlayCanvas.height);
        this.context.selectionManager.update(deltaTime);
        this.context.selectionManager.draw();
        
        if (this.context.state.currentTool.type === 'paste' && this.context.state.pastePreview) {
            this.context.clipboardManager.drawPastePreview();
        }
        
        requestAnimationFrame(this._animationLoop);
    }
    
    resetEditor(width, height) {
        this.context.grid.resize(width, height);
        this.context.objectManager.clear();
        this.context.history.clear();
        this.uiManager.deselectObject();
    }

    _checkForEditMode() {
        const levelDataJSON = sessionStorage.getItem('editingLevelData');
        const levelIndex = sessionStorage.getItem('editingLevelIndex');

        if (levelDataJSON && levelIndex !== null) {
            try {
                const levelData = JSON.parse(levelDataJSON);
                this.editingLevelIndex = parseInt(levelIndex, 10);
                this.resetEditor(levelData.gridWidth, levelData.gridHeight);
                DOM.levelNameInput.value = levelData.name;
                DOM.backgroundInput.value = levelData.background || 'background_blue';

                if (levelData.tileData) {
                    const decodedTileData = LevelImporter._decodeRLEToTileData(levelData.tileData, levelData.gridWidth, levelData.gridHeight);
                    this.context.grid.tileData = new Array(this.context.grid.width * this.context.grid.height).fill(0);
                    decodedTileData.forEach(tile => {
                        const index = tile.y * this.context.grid.width + tile.x;
                        this.context.grid.tileData[index] = parseInt(tile.id, 10);
                    });
                    this.context.grid.drawAllTiles();
                }
                this.context.objectManager.load(levelData);
                this.context.history.clear();

                DOM.createLevelBtn.textContent = 'Save Changes';
                document.title = `Editing: ${levelData.name}`;

                sessionStorage.removeItem('editingLevelData');
                sessionStorage.removeItem('editingLevelIndex');
            } catch (e) {
                console.error("Failed to load level for editing:", e);
                alert("There was an error loading the level data for editing.");
                this.editingLevelIndex = null;
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    DOM.init();
    const editor = new EditorApp();
    editor.init();
});