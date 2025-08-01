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
import { UpdatePropertyCommand } from './commands/UpdatePropertyCommand.js';





















const round = (val) => Math.round(val * 100) / 100;

class EditorApp {
    constructor() {

        this.context = {
            state: new EditorState(),
            grid: new Grid(28, 15),
            objectManager: new ObjectManager(),
            history: new HistoryManager(DOM.undoBtn, DOM.redoBtn),
            assets: null,
            fontRenderer: null,
            app: this,
        };


        this.context.palette = new Palette(this._onPaletteSelection.bind(this));
        this.context.propertiesPanel = new PropertiesPanel(this._onPropertyUpdate.bind(this));
        this.context.selectionManager = new SelectionManager(this.context);
        this.context.clipboardManager = new ClipboardManager(this.context);
        this.context.toolManager = new ToolManager(this.context);
        this.context.uiManager = new UIManager(this.context);
        this.context.previewManager = new PreviewManager(this.context);
        this.context.keyboardManager = new KeyboardManager(this.context);
        this.context.inputHandler = new GridInputHandler(this.context);

        this.editingLevelIndex = null;
        this.lastTimestamp = 0;
        this.objectPropChange = { isChanging: false, oldValue: 0 };
    }

    async init() {
        this.context.grid.generate();
        this.context.uiManager.init();
        this.context.keyboardManager.init();
        this.context.inputHandler.init();

        Toolbar.setup({
            onNew: () => this.resetEditor(28, 15),
            onResize: () => DOM.resizeModalOverlay.style.display = 'flex',
            onFileLoad: (e) => this.context.uiManager.handleFileLoad(e),
            onExport: () => this.context.uiManager.handleExport(),
            onTestLevel: () => this.context.previewManager.start(),
            onUndo: () => this.context.history.undo(),
            onRedo: () => this.context.history.redo(),
            onZoomIn: () => this.context.grid.zoom(0.1),
            onZoomOut: () => this.context.grid.zoom(-0.1),
            onCreateLevel: () => this.context.uiManager.handleCreateLevel(),
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
        } finally {
            if (loadingOverlay.parentElement) loadingOverlay.remove();
        }
    }

    _onPaletteSelection(selection) {
        const { state, uiManager, selectionManager, propertiesPanel, toolManager, inputHandler } = this.context;
        uiManager.deselectObject();
        selectionManager.clearSelection();
        state.pastePreview = null;
        state.clipboard = null;

        let toolName = selection.type;
        if (selection.type === 'tile') toolName = 'paint';
        else if (selection.type === 'object' || selection.type === 'enemy') toolName = 'place';

        state.currentTool = { type: toolName, id: selection.id };
        toolManager.setActiveTool(toolName);

        if (selection.type === 'tool') {
            propertiesPanel.displayToolProperties(selection.id, { eraserSize: state.eraserSize });
            inputHandler.setCursor(selection.id === 'select' ? 'crosshair' : 'none');
        } else {
            propertiesPanel.showItemDescription(selection.type, selection.id);
            inputHandler.setCursor('crosshair');
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
                this.context.history.push(new UpdatePropertyCommand(this.context.objectManager, id, prop, oldValue, finalValue));
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

    _animationLoop = (timestamp) => {
        const deltaTime = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;

        const { grid, state, selectionManager, clipboardManager } = this.context;
        grid.overlayCtx.clearRect(0, 0, grid.overlayCanvas.width, grid.overlayCanvas.height);

        selectionManager.update(deltaTime);
        selectionManager.draw();

        if (state.currentTool.type === 'eraser' && state.pastePreview) {
            this._drawEraserCursor();
        }
        if (state.currentTool.type === 'paste' && state.pastePreview) {
            clipboardManager.drawPastePreview();
        }
        requestAnimationFrame(this._animationLoop);
    }

    _drawEraserCursor() {
        const { state, grid } = this.context;
        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const ctx = grid.overlayCtx;
        const size = state.eraserSize * TILE_SIZE;
        const brushRadius = Math.floor(state.eraserSize / 2);
        const x = (state.pastePreview.gridX - brushRadius) * TILE_SIZE;
        const y = (state.pastePreview.gridY - brushRadius) * TILE_SIZE;
        ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);
    }

    resetEditor(width, height) {
        this.context.grid.resize(width, height);
        this.context.objectManager.clear();
        this.context.history.clear();
        this.context.uiManager.deselectObject();
    }

    selectObject(id) {
        this.context.uiManager.selectObject(id);
    }

    deselectObject() {
        this.context.uiManager.deselectObject();
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
    const app = new EditorApp();
    app.init();
});