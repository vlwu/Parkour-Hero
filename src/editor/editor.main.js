import { DOM } from './ui/DOM.js';
import { Palette } from './ui/Palette.js';
import { PropertiesPanel } from './ui/PropertiesPanel.js';
import { Toolbar } from './ui/Toolbar.js';
import { HistoryManager } from './core/HistoryManager.js';
import { Grid } from './grid/Grid.js';
import { ObjectManager } from './core/ObjectManager.js';
import { GridInputHandler } from './grid/GridInputHandler.js';
import { LevelExporter } from './io/LevelExporter.js';
import { LevelImporter } from './io/LevelImporter.js';

import { Engine } from '../core/engine.js';
import { assetManager } from '../managers/asset-manager.js';
import { FontRenderer } from '../ui/font-renderer.js';
import { GRID_CONSTANTS } from '../utils/constants.js';
import { EditorState } from './EditorState.js';
import { ToolManager } from './tools/ToolManager.js';

// Command Imports
import { CompositeCommand } from './commands/CompositeCommand.js';
import { PaintCommand } from './commands/PaintCommand.js';
import { PlaceObjectCommand } from './commands/PlaceObjectCommand.js';
import { DeleteObjectCommand } from './commands/DeleteObjectCommand.js';
import { MoveObjectCommand } from './commands/MoveObjectCommand.js';
import { UpdatePropertyCommand } from './commands/UpdatePropertyCommand.js';
import { ResizeCommand } from './commands/ResizeCommand.js';

const round = (val) => Math.round(val * 100) / 100;

class EditorApp {
    constructor() {
        /** @type {EditorAppContext} */
        this.context = {
            state: new EditorState(),
            grid: new Grid(28, 15),
            objectManager: new ObjectManager(this.grid),
            history: new HistoryManager(DOM.undoBtn, DOM.redoBtn),
            palette: null,
            propertiesPanel: null,
            assets: null,
            fontRenderer: null,
            selectObject: (id) => this.selectObject(id),
            deselectObject: () => this.deselectObject(),
            onSelectionChange: (start, current) => this._onSelectionChange(start, current),
            onSelectionEnd: () => this._onSelectionEnd(),
            onObjectDrag: (id, newX, newY) => this._onObjectDrag(id, newX, newY),
            app: this,
        };

        this.context.palette = new Palette(this._onPaletteSelection.bind(this));
        this.context.propertiesPanel = new PropertiesPanel(this._onPropertyUpdate.bind(this));
        
        this.toolManager = new ToolManager(this.context);
        this.inputHandler = new GridInputHandler(DOM.gridContainer, this.context.grid, this.toolManager);

        this.editingLevelIndex = null;
        this.engine = null;
        this.marchingAntsOffset = 0;
    }

    init() {
        this.context.grid.generate();
        this.context.palette.populate();
        Toolbar.setup({
            onNew: () => this.resetEditor(28, 15),
            onResize: this._onResize.bind(this),
            onFileLoad: this._onFileLoad.bind(this),
            onExport: this._onExport.bind(this),
            onTestLevel: this._onTestLevel.bind(this),
            onUndo: this._onUndo.bind(this),
            onRedo: this._onRedo.bind(this),
            onZoomIn: () => this.context.grid.zoom(0.1),
            onZoomOut: () => this.context.grid.zoom(-0.1),
            onCreateLevel: this._onCreateLevel.bind(this),
            onBack: this._onBack.bind(this),
            onCopySelection: () => this._handleSelectionAction('copy'),
            onCutSelection: () => this._handleSelectionAction('cut'),
            onDeleteSelection: () => this._handleSelectionAction('delete'),
        });
        window.addEventListener('resize', () => this.context.grid.autoFitScale());
        window.addEventListener('keydown', (e) => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
                return;
            }
            if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); this._onUndo(); }
            if (e.ctrlKey && e.key.toLowerCase() === 'y') { e.preventDefault(); this._onRedo(); }
            if (e.ctrlKey && e.key.toLowerCase() === 'c') { this._handleSelectionAction('copy'); }
            if (e.ctrlKey && e.key.toLowerCase() === 'x') { this._handleSelectionAction('cut'); }
            if (e.ctrlKey && e.key.toLowerCase() === 'v') { this._preparePaste(); }
            if (e.key === 'Delete') { this._handleSelectionAction('delete'); }
            if (e.key === 'Escape') { this._onRightClick(); }
            if (!e.ctrlKey && e.key.toLowerCase() === 'e') {
                this.context.palette.selectTool('eraser');
            }
            if (!e.ctrlKey && e.key.toLowerCase() === 'v') {
                this.context.palette.selectTool('select');
            }
        });
        this._onPaletteSelection({ type: 'tile', id: '1' });
        this._loadGameAssets();
        this._setupResizeModalListeners();
        this._checkForEditMode();
        this._animationLoop();
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


    async _loadGameAssets() {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'editor-loading-overlay';
        loadingOverlay.textContent = 'Loading Game Assets...';
        document.body.appendChild(loadingOverlay);

        try {

            await assetManager.loadCoreAssets();
            await assetManager.loadGameplayAssets();
            this.context.assets = assetManager.assets;

            this.context.fontRenderer = new FontRenderer(this.context.assets.font_spritesheet);
            console.log("Editor: Game assets loaded successfully.");
            DOM.testLevelBtn.disabled = false;
        } catch (error) {
            console.error("Editor: Failed to load game assets.", error);
            loadingOverlay.textContent = 'Error loading assets. Preview disabled.';
            setTimeout(() => loadingOverlay.remove(), 3000);
            return;
        }

        loadingOverlay.remove();
    }

    _onTestLevel() {
        if (!this.context.assets || !this.context.fontRenderer) {
            alert("Game assets are not loaded yet. Please wait.");
            return;
        }

        const { startPos, finalEntities } = this.context.objectManager.getObjectsForExport();
        const levelData = {
            name: `Preview: ${DOM.levelNameInput.value}`,
            gridWidth: this.context.grid.width,
            gridHeight: this.context.grid.height,
            background: DOM.backgroundInput.value,
            startPosition: startPos,
            tileData: LevelExporter._encodeTileDataToRLE(this.context.grid.getTileDataForExport(), this.context.grid.width, this.context.grid.height),
            entities: finalEntities,
        };

        const previewContainer = document.getElementById('game-preview-container');
        const uiRoot = document.getElementById('preview-ui-root');
        const gameCanvas = document.getElementById('preview-game-canvas');
        const particleCanvas = document.getElementById('preview-particle-canvas');
        const exitBtn = document.getElementById('exit-preview-btn');

        if (!previewContainer || !gameCanvas || !particleCanvas || !exitBtn || !uiRoot) {
            console.error("Preview DOM elements not found!");
            return;
        }

        gameCanvas.width = 1920; gameCanvas.height = 1080;
        particleCanvas.width = 1920; particleCanvas.height = 1080;

        const resizePreview = () => {
            const aspectRatio = 16 / 9;
            const windowRatio = window.innerWidth / window.innerHeight;
            let width, height;
            if (windowRatio > aspectRatio) {
                height = window.innerHeight;
                width = height * aspectRatio;
            } else {
                width = window.innerWidth;
                height = width / aspectRatio;
            }
            const finalWidth = Math.floor(width);
            const finalHeight = Math.floor(height);
            const left = `${(window.innerWidth - finalWidth) / 2}px`;
            const top = `${(window.innerHeight - finalHeight) / 2}px`;
            [gameCanvas, particleCanvas, uiRoot].forEach(el => {
                el.style.width = `${finalWidth}px`;
                el.style.height = `${finalHeight}px`;
                el.style.left = left;
                el.style.top = top;
            });
        };

        resizePreview();
        window.addEventListener('resize', resizePreview);

        const ctx = gameCanvas.getContext('2d');
        const gl = particleCanvas.getContext('webgl2', { alpha: true });
        ctx.imageSmoothingEnabled = false;

        this.engine = new Engine(gl, uiRoot, ctx, this.context.assets, {}, this.context.fontRenderer, assetManager);
        this.engine.renderer.previewMode = true;
        this.engine.soundManager.setEnabled(false);
        this.engine.loadLevelFromData(levelData);
        this.engine.playerEntityId = null;

        previewContainer.style.display = 'flex';

        let animationFrameId = null;
        let lastTime = 0;
        const cameraSpeed = 500;
        const cameraKeys = { up: false, down: false, left: false, right: false };

        const handleKeyDown = (e) => {
            switch (e.key.toLowerCase()) {
                case 'w': case 'arrowup': cameraKeys.up = true; break;
                case 's': case 'arrowdown': cameraKeys.down = true; break;
                case 'a': case 'arrowleft': cameraKeys.left = true; break;
                case 'd': case 'arrowright': cameraKeys.right = true; break;
            }
        };

        const handleKeyUp = (e) => {
            switch (e.key.toLowerCase()) {
                case 'w': case 'arrowup': cameraKeys.up = false; break;
                case 's': case 'arrowdown': cameraKeys.down = false; break;
                case 'a': case 'arrowleft': cameraKeys.left = false; break;
                case 'd': case 'arrowright': cameraKeys.right = false; break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const previewLoop = (timestamp) => {
            if (!this.engine) return;
            if (lastTime === 0) lastTime = timestamp;
            const deltaTime = (timestamp - lastTime) / 1000;
            lastTime = timestamp;

            if (cameraKeys.up) this.engine.camera.y -= cameraSpeed * deltaTime;
            if (cameraKeys.down) this.engine.camera.y += cameraSpeed * deltaTime;
            if (cameraKeys.left) this.engine.camera.x -= cameraSpeed * deltaTime;
            if (cameraKeys.right) this.engine.camera.x += cameraSpeed * deltaTime;

            this.engine.camera.x = Math.max(this.engine.camera.minX, Math.min(this.engine.camera.maxX, this.engine.camera.x));
            this.engine.camera.y = Math.max(this.engine.camera.minY, Math.min(this.engine.camera.maxY, this.engine.camera.y));

            this.engine.camera.update(this.engine.entityManager, null, deltaTime);

            this.engine.render(1.0);

            animationFrameId = requestAnimationFrame(previewLoop);
        };

        animationFrameId = requestAnimationFrame(previewLoop);

        const exitPreview = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            if (this.engine) {
                this.engine.destroy();
                this.engine = null;
            }
            previewContainer.style.display = 'none';
            uiRoot.innerHTML = '';
            exitBtn.removeEventListener('click', exitPreview);
            window.removeEventListener('resize', resizePreview);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
        exitBtn.addEventListener('click', exitPreview);
    }

    resetEditor(width, height) {
        this.context.grid.resize(width, height);
        this.context.objectManager.clear();
        this.context.history.clear();
        this.deselectObject();
    }

    _onPaletteSelection(selection) {
        this.deselectObject();
        this._clearSelection();
        this.state.pastePreview = null;
        this.state.clipboard = null;
    
        let toolName = selection.type;
        if (selection.type === 'tile') {
            toolName = 'paint';
        } else if (selection.type === 'object' || selection.type === 'enemy') {
            toolName = 'place';
        }
    
        this.state.currentTool = { type: toolName, id: selection.id };
        this.toolManager.setActiveTool(toolName);
    
        if (selection.type === 'tool') {
            this.context.propertiesPanel.displayToolProperties(selection.id, { eraserSize: this.state.eraserSize });
            this.inputHandler.setCursor(selection.id === 'select' ? 'crosshair' : 'none');
        } else {
            this.context.propertiesPanel.showItemDescription(selection.type, selection.id);
            this.inputHandler.setCursor('crosshair');
        }
    }

    _onPropertyUpdate(id, prop, value, type) {
        if (id === null) {
            if (prop === 'eraserSize') { this.state.eraserSize = value; }
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

    _onResize() {
        DOM.newWidthInput.value = this.context.grid.width;
        DOM.newHeightInput.value = this.context.grid.height;
        DOM.resizeModalOverlay.style.display = 'flex';
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
        const oldWidth = this.context.grid.width;
        const oldHeight = this.context.grid.height;
        const oldTileData = [...this.context.grid.tileData];
        const oldObjects = JSON.parse(JSON.stringify(this.context.objectManager.getAllObjects()));

        const beforeState = { width: oldWidth, height: oldHeight, tileData: oldTileData, objects: oldObjects };

        const dx = newWidth - oldWidth;
        const dy = newHeight - oldHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (anchor.includes('right')) offsetX = -dx;
        else if (anchor.includes('center')) offsetX = -Math.floor(dx / 2);
        if (anchor.includes('bottom')) offsetY = -dy;
        else if (anchor.includes('middle')) offsetY = -Math.floor(dy / 2);

        this.context.grid.resize(newWidth, newHeight, oldTileData, anchor);

        this.context.objectManager.clear();
        oldObjects.forEach(obj => {
            const newX = obj.x + offsetX;
            const newY = obj.y + offsetY;

            if (newX >= 0 && (newX * GRID_CONSTANTS.TILE_SIZE) < (newWidth * GRID_CONSTANTS.TILE_SIZE) && newY >= 0 && (newY * GRID_CONSTANTS.TILE_SIZE) < (newHeight * GRID_CONSTANTS.TILE_SIZE)) {
                obj.x = newX;
                obj.y = newY;
                this.context.objectManager.objects.push(obj);
            }
        });
        this.context.objectManager.render();

        const afterState = {
            width: newWidth,
            height: newHeight,
            tileData: [...this.context.grid.tileData],
            objects: JSON.parse(JSON.stringify(this.context.objectManager.getAllObjects()))
        };

        this.history.push(new ResizeCommand(this.context.grid, this.context.objectManager, beforeState, afterState));
    }


    _onFileLoad(e) {
        const files = e.target.files;
        if (!files || files.length === 0) {
            return;
        }
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
    }

    _onExport() {
        LevelExporter.export(this.context.grid, this.context.objectManager, DOM.levelNameInput.value, DOM.backgroundInput.value);
    }

    _onBack() {
        window.location.href = 'index.html#levels';
    }

    _onCreateLevel() {
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

    _onUndo() {
        this.context.history.undo();
    }

    _onRedo() {
        this.context.history.redo();
    }

    selectObject(id) {
        const obj = this.context.objectManager.getObject(id);
        if (!obj) return;
        this.deselectObject();
        this.state.selectedObject = obj;
        this.context.propertiesPanel.displayObject(obj);
        DOM.gridContainer.querySelector(`.dynamic-object[data-id='${obj.id}']`)?.classList.add('selected');
    }

    deselectObject() {
        if (!this.state.selectedObject) return;
        DOM.gridContainer.querySelector(`.dynamic-object[data-id='${this.state.selectedObject.id}']`)?.classList.remove('selected');
        this.state.selectedObject = null;
        this.context.propertiesPanel.clear();
    }

    _animationLoop = () => {
        this.marchingAntsOffset = (this.marchingAntsOffset + 0.5) % 10;
        this.context.grid.overlayCtx.clearRect(0, 0, this.context.grid.overlayCanvas.width, this.context.grid.overlayCanvas.height);

        if (this.state.selection) {
            this._drawSelection();
        }
        if (this.state.currentTool.type === 'eraser' && this.state.pastePreview) {
            this._drawEraserCursor();
        }
        if (this.state.currentTool.type === 'paste' && this.state.pastePreview) {
            this._drawPastePreview();
        }
        requestAnimationFrame(this._animationLoop);
    }

    _drawSelection() {
        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const ctx = this.context.grid.overlayCtx;
        const x = this.state.selection.x * TILE_SIZE;
        const y = this.state.selection.y * TILE_SIZE;
        const width = this.state.selection.width * TILE_SIZE;
        const height = this.state.selection.height * TILE_SIZE;

        ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -this.marchingAntsOffset;
        ctx.strokeRect(x, y, width, height);
        ctx.setLineDash([]);
    }

    _drawEraserCursor() {
        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const ctx = this.context.grid.overlayCtx;
        const size = this.state.eraserSize * TILE_SIZE;
        const brushRadius = Math.floor(this.state.eraserSize / 2);
        const x = (this.state.pastePreview.gridX - brushRadius) * TILE_SIZE;
        const y = (this.state.pastePreview.gridY - brushRadius) * TILE_SIZE;
        ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);
    }

    _drawPastePreview() {
        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const ctx = this.context.grid.overlayCtx;
        ctx.globalAlpha = 0.6;
        const startX = (this.state.pastePreview.gridX - Math.floor(this.state.clipboard.width / 2)) * TILE_SIZE;
        const startY = (this.state.pastePreview.gridY - Math.floor(this.state.clipboard.height / 2)) * TILE_SIZE;

        for (const tile of this.state.clipboard.tiles) {
            const x = startX + tile.x * TILE_SIZE;
            const y = startY + tile.y * TILE_SIZE;
            const tileId = parseInt(tile.id, 10);
            const isSpecial = tileId > SPECIAL_TILE_ID_OFFSET;
            const sourceImage = isSpecial ? this.context.palette.specialTileset.image : this.context.palette.mainTileset.image;
            const sourceConfig = isSpecial ? TILESET_CONFIG_SPECIAL : TILESET_CONFIG;
            const localId = (isSpecial ? tileId - SPECIAL_TILE_ID_OFFSET : tileId) - 1;
            const sx = (localId % sourceConfig.columns) * sourceConfig.tileWidth;
            const sy = Math.floor(localId / sourceConfig.columns) * sourceConfig.tileHeight;
            ctx.drawImage(sourceImage, sx, sy, sourceConfig.tileWidth, sourceConfig.tileHeight, x, y, TILE_SIZE, TILE_SIZE);
        }
        ctx.globalAlpha = 1.0;
    }

    _onSelectionChange(start, current) {
        const x1 = Math.min(start.x, current.x);
        const y1 = Math.min(start.y, current.y);
        const x2 = Math.max(start.x, current.x);
        const y2 = Math.max(start.y, current.y);
        this.state.selection = { x: x1, y: y1, width: x2 - x1 + 1, height: y2 - y1 + 1 };
        DOM.selectionActions.style.display = 'flex';
    }

    _onSelectionEnd() {}
    _clearSelection() {
        this.state.selection = null;
        DOM.selectionActions.style.display = 'none';
    }

    _onHover(gridX, gridY) {
        if(this.state.currentTool.type === 'eraser' || this.state.currentTool.type === 'paste') {
            const pixelX = gridX * GRID_CONSTANTS.TILE_SIZE + GRID_CONSTANTS.TILE_SIZE / 2;
            const pixelY = gridY * GRID_CONSTANTS.TILE_SIZE + GRID_CONSTANTS.TILE_SIZE / 2;
            this.state.pastePreview = { pixelX, pixelY, gridX, gridY };

            if(this.state.currentTool.type === 'paste' && this.state.clipboard.isDragging) {
                const dx = gridX - this.state.clipboard.dragStart.x;
                const dy = gridY - this.state.clipboard.dragStart.y;
                this.state.clipboard.objects.forEach(obj => {
                    const original = this.state.clipboard.originalObjects.find(o => o.id === obj.id);
                    obj.x = original.x + dx;
                    obj.y = original.y + dy;
                });
                this.context.objectManager.render();
            }

        } else {
            this.state.pastePreview = null;
        }

        const selection = this.state.selection;
        if (selection && gridX >= selection.x && gridX < selection.x + selection.width &&
            gridY >= selection.y && gridY < selection.y + selection.height) {
            this.inputHandler.setCursor('move');
        } else if (this.state.currentTool.type === 'select') {
            this.inputHandler.setCursor('crosshair');
        } else if (this.state.currentTool.type === 'eraser') {
            this.inputHandler.setCursor('none');
        } else {
            this.inputHandler.setCursor('crosshair');
        }
    }

    _onRightClick() {
        if (this.state.selection || this.state.currentTool.type === 'paste') {
            this._clearSelection();
            this.state.pastePreview = null;
            this.state.clipboard = null;
            this.context.palette.selectTool('select');
        } else {
            this.state.currentTool = { type: 'none' };
            this.context.palette.updateSelectionVisuals();
            this.context.propertiesPanel.clear();
            this.inputHandler.setCursor('default');
        }
    }

    _handleSelectionAction(action) {
        if (!this.state.selection) return;

        const sel = this.state.selection;
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
            this.state.clipboard = clipboardData;
            this._preparePaste();
        } else if (action === 'cut' || action === 'delete') {
            if (action === 'cut') {
                this.state.clipboard = clipboardData;
            }

            const paintChanges = [];
            for (let y = 0; y < sel.height; y++) {
                for (let x = 0; x < sel.width; x++) {
                    const index = (sel.y + y) * this.context.grid.width + (sel.x + x);
                    const oldId = this.context.grid.getTileId(index);
                    if (oldId !== '0') {
                        paintChanges.push({ index, from: oldId, to: '0' });
                        this.context.grid.paintCell(index, '0');
                    }
                }
            }
            if (paintChanges.length > 0) {
                this.history.push(new PaintCommand(this.context.grid, paintChanges));
            }

            clipboardData.objects.forEach(objData => {
                const originalObj = this.context.objectManager.getObject(objData.id);
                if (originalObj) {
                    this._onObjectDelete(originalObj.id);
                }
            });

            this._clearSelection();
            if (action === 'cut') {
                this._preparePaste();
            }
        }
    }

    _preparePaste() {
        if (!this.state.clipboard) return;
        this.state.currentTool = { type: 'paste' };
        this.toolManager.setActiveTool('paste');
        this.inputHandler.setCursor('none');
        this._clearSelection();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    DOM.init();
    const editor = new EditorApp();
    editor.init();
});