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
        this.state = new EditorState();
        this.grid = new Grid(28, 15);
        this.objectManager = new ObjectManager(this.grid);
        this.history = new HistoryManager(DOM.undoBtn, DOM.redoBtn);

        this.objectDragStartPosition = null;
        this.currentPaintAction = null;
        this.objectPropChange = { isChanging: false, oldValue: 0 };
        this.editingLevelIndex = null;
        this.assets = null;
        this.fontRenderer = null;
        this.engine = null;
        this.marchingAntsOffset = 0;

        this.palette = new Palette(this._onPaletteSelection.bind(this));
        this.propertiesPanel = new PropertiesPanel(this._onPropertyUpdate.bind(this));

        this.inputHandler = new GridInputHandler(DOM.gridContainer, this.grid, {
            getCurrentTool: () => this.state.currentTool.type,
            onPaintStart: this._onPaintStart.bind(this),
            onPaint: this._onPaint.bind(this),
            onErase: this._onErase.bind(this),
            onPaintEnd: this._onPaintEnd.bind(this),
            onObjectPlace: this._onObjectPlace.bind(this),
            onObjectDelete: this._onObjectDelete.bind(this),
            onObjectSelect: this._onObjectSelect.bind(this),
            onEraseObject: this._onEraseObject.bind(this),
            onObjectDragStart: this._onObjectDragStart.bind(this),
            onObjectDrag: this._onObjectDrag.bind(this),
            onObjectDragEnd: this._onObjectDragEnd.bind(this),
            onSelectionChange: this._onSelectionChange.bind(this),
            onSelectionEnd: this._onSelectionEnd.bind(this),
            onHover: this._onHover.bind(this),
            onPaste: this._onPaste.bind(this),
            onRightClick: this._onRightClick.bind(this),
        });
    }

    init() {
        this.grid.generate();
        this.palette.populate();
        Toolbar.setup({
            onNew: () => this.resetEditor(28, 15),
            onResize: this._onResize.bind(this),
            onFileLoad: this._onFileLoad.bind(this),
            onExport: this._onExport.bind(this),
            onTestLevel: this._onTestLevel.bind(this),
            onUndo: this._onUndo.bind(this),
            onRedo: this._onRedo.bind(this),
            onZoomIn: () => this.grid.zoom(0.1),
            onZoomOut: () => this.grid.zoom(-0.1),
            onCreateLevel: this._onCreateLevel.bind(this),
            onBack: this._onBack.bind(this),
            onCopySelection: () => this._handleSelectionAction('copy'),
            onCutSelection: () => this._handleSelectionAction('cut'),
            onDeleteSelection: () => this._handleSelectionAction('delete'),
        });
        window.addEventListener('resize', () => this.grid.autoFitScale());
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
                this.palette.selectTool('eraser');
            }
            if (!e.ctrlKey && e.key.toLowerCase() === 'v') {
                this.palette.selectTool('select');
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
                    this.grid.tileData = new Array(this.grid.width * this.grid.height).fill(0);
                    decodedTileData.forEach(tile => {
                        const index = tile.y * this.grid.width + tile.x;
                        this.grid.tileData[index] = parseInt(tile.id, 10);
                    });
                    this.grid.drawAllTiles();
                }
                this.objectManager.load(levelData);
                this.history.clear();

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
            this.assets = assetManager.assets;

            this.fontRenderer = new FontRenderer(this.assets.font_spritesheet);
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
        if (!this.assets || !this.fontRenderer) {
            alert("Game assets are not loaded yet. Please wait.");
            return;
        }

        const { startPos, finalEntities } = this.objectManager.getObjectsForExport();
        const levelData = {
            name: `Preview: ${DOM.levelNameInput.value}`,
            gridWidth: this.grid.width,
            gridHeight: this.grid.height,
            background: DOM.backgroundInput.value,
            startPosition: startPos,
            tileData: LevelExporter._encodeTileDataToRLE(this.grid.getTileDataForExport(), this.grid.width, this.grid.height),
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

        this.engine = new Engine(gl, uiRoot, ctx, this.assets, {}, this.fontRenderer, assetManager);
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
        this.grid.resize(width, height);
        this.objectManager.clear();
        this.history.clear();
        this.deselectObject();
    }

    _onPaletteSelection(selection) {
        this.deselectObject();
        this._clearSelection();
        this.state.pastePreview = null;
        this.state.clipboard = null;

        if (selection.type === 'tool') {
            this.state.currentTool = { type: selection.id };
            this.propertiesPanel.displayToolProperties(selection.id, { eraserSize: this.state.eraserSize });
            this.inputHandler.setCursor(selection.id === 'select' ? 'crosshair' : 'none');
        } else if (selection.type === 'tile') {
            this.state.currentTool = { type: 'paint', id: selection.id };
            this.propertiesPanel.showItemDescription('tile', selection.id);
            this.inputHandler.setCursor('crosshair');
        } else {
            this.state.currentTool = { type: 'place', id: selection.id };
            this.propertiesPanel.showItemDescription(selection.type, selection.id);
            this.inputHandler.setCursor('crosshair');
        }
    }

    _onPropertyUpdate(id, prop, value, type) {
        if (id === null) {
            if (prop === 'eraserSize') { this.state.eraserSize = value; }
            return;
        }

        const obj = this.objectManager.getObject(id);
        if (!obj) return;

        if (type === 'live') {
            if (!this.objectPropChange.isChanging) {
                this.objectPropChange.isChanging = true;
                this.objectPropChange.oldValue = obj[prop];
            }
            this.objectManager.updateObjectProp(id, prop, value);
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
                this.objectManager.updateObjectProp(id, prop, finalValue);
                this.history.push(new UpdatePropertyCommand(this.objectManager, id, prop, oldValue, finalValue));
            } else {
                 this.objectManager.updateObjectProp(id, prop, finalValue);
            }
        }
    }

    _onPaintStart() {
        if (this.state.currentTool.type === 'eraser') {
            this.currentPaintAction = { tileChanges: [], deletedObjects: [] };
        } else {
            this.currentPaintAction = { changes: [] };
        }
    }

    _onPaint(gridX, gridY) {
        if (!this.currentPaintAction || this.state.currentTool.type !== 'paint') return;
        const tileId = this.state.currentTool.id;
        const index = gridY * this.grid.width + gridX;

        const oldId = this.grid.getTileId(index);
        if (oldId !== tileId && !this.currentPaintAction.changes.some(c => c.index === index)) {
            this.currentPaintAction.changes.push({ index, from: oldId, to: tileId });
            this.grid.paintCell(index, tileId);
        }
    }

    _onErase(gridX, gridY) {
        if (!this.currentPaintAction || this.state.currentTool.type !== 'eraser') return;

        const brushRadius = Math.floor(this.state.eraserSize / 2);
        for (let y = -brushRadius; y <= brushRadius; y++) {
            for (let x = -brushRadius; x <= brushRadius; x++) {
                const currentX = gridX + x;
                const currentY = gridY + y;
                if (currentX >= 0 && currentX < this.grid.width && currentY >= 0 && currentY < this.grid.height) {
                    const index = currentY * this.grid.width + currentX;
                    const oldId = this.grid.getTileId(index);
                    if (oldId !== '0' && !this.currentPaintAction.tileChanges.some(c => c.index === index)) {
                        this.currentPaintAction.tileChanges.push({ index, from: oldId, to: '0' });
                        this.grid.paintCell(index, '0');
                    }
                }
            }
        }
    }

    _onEraseObject(id) {
        if (!this.currentPaintAction || this.state.currentTool.type !== 'eraser') return;
        const objectToDelete = this.objectManager.getObject(id);
        if (objectToDelete && objectToDelete.type !== 'player_spawn' && !this.currentPaintAction.deletedObjects.some(o => o.id === id)) {
            this.currentPaintAction.deletedObjects.push(JSON.parse(JSON.stringify(objectToDelete)));
            this.objectManager.deleteObject(id);
        }
    }

    _onPaintEnd() {
        if (!this.currentPaintAction) return;
        
        const compositeCommand = new CompositeCommand();

        if (this.state.currentTool.type === 'eraser') {
            if (this.currentPaintAction.tileChanges.length > 0) {
                compositeCommand.add(new PaintCommand(this.grid, this.currentPaintAction.tileChanges));
            }
            if (this.currentPaintAction.deletedObjects.length > 0) {
                this.currentPaintAction.deletedObjects.forEach(obj => {
                    compositeCommand.add(new DeleteObjectCommand(this.objectManager, obj));
                });
            }
        } else {
            if (this.currentPaintAction.changes.length > 0) {
                compositeCommand.add(new PaintCommand(this.grid, this.currentPaintAction.changes));
            }
        }

        if (compositeCommand.commands.length > 0) {
            this.history.push(compositeCommand);
        }
        this.currentPaintAction = null;
    }

    _onObjectPlace(pixelX, pixelY) {
        const type = this.state.currentTool.id;
        const { newObject, replacedSpawn } = this.objectManager.addObject(type, pixelX, pixelY);
        this.history.push(new PlaceObjectCommand(this.objectManager, newObject, replacedSpawn));
        this.selectObject(newObject);
    }

    _onObjectDelete(id) {
        const objectToDelete = this.objectManager.getObject(id);
        if (!objectToDelete) return;
        if (objectToDelete.type === 'player_spawn') {
            alert('The Player Spawn cannot be deleted. To move it, simply left-click and drag it to a new position.');
            return;
        }
        this.history.push(new DeleteObjectCommand(this.objectManager, objectToDelete));
        if (this.state.selectedObject && this.state.selectedObject.id === id) { this.deselectObject(); }
        this.objectManager.deleteObject(id);
    }

    _onObjectSelect(id) {
        const obj = this.objectManager.getObject(id);
        this.selectObject(obj);
    }

    _onObjectDragStart(id) {
        const obj = this.objectManager.getObject(id);
        this.selectObject(obj);
        return { x: obj.x, y: obj.y };
    }

    _onObjectDrag(id, newX, newY) {
        const obj = this.objectManager.getObject(id);
        if (!obj) return;
        obj.x = newX;
        obj.y = newY;
        const el = DOM.gridContainer.querySelector(`.dynamic-object[data-id='${id}']`);
        if (el) {
            el.style.left = `${obj.x * GRID_CONSTANTS.TILE_SIZE - (obj.width / 2)}px`;
            el.style.top = `${obj.y * GRID_CONSTANTS.TILE_SIZE - (obj.height / 2)}px`;
        }
        this.propertiesPanel.displayObject(obj);
    }

    _onObjectDragEnd(id) {
        const obj = this.objectManager.getObject(id);
        this.objectManager._applySnapping(obj);
        this.objectManager._updateGroundedEnemyBehavior(obj);

        const finalX = round(obj.x);
        const finalY = round(obj.y);
        const initial = this.objectDragStartPosition;

        if (initial && (initial.x !== finalX || initial.y !== finalY)) {
            this.history.push(new MoveObjectCommand(this.objectManager, id, { x: initial.x, y: initial.y }, { x: finalX, y: finalY }));
        }

        this.objectDragStartPosition = null;

        obj.x = finalX; obj.y = finalY;
        this.objectManager.render();
        this.propertiesPanel.displayObject(obj);
    }

    _onResize() {
        DOM.newWidthInput.value = this.grid.width;
        DOM.newHeightInput.value = this.grid.height;
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
        const oldWidth = this.grid.width;
        const oldHeight = this.grid.height;
        const oldTileData = [...this.grid.tileData];
        const oldObjects = JSON.parse(JSON.stringify(this.objectManager.getAllObjects()));

        const beforeState = { width: oldWidth, height: oldHeight, tileData: oldTileData, objects: oldObjects };

        const dx = newWidth - oldWidth;
        const dy = newHeight - oldHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (anchor.includes('right')) offsetX = -dx;
        else if (anchor.includes('center')) offsetX = -Math.floor(dx / 2);
        if (anchor.includes('bottom')) offsetY = -dy;
        else if (anchor.includes('middle')) offsetY = -Math.floor(dy / 2);

        this.grid.resize(newWidth, newHeight, oldTileData, anchor);

        const newObjectsList = [];
        this.objectManager.clear();
        oldObjects.forEach(obj => {
            const newX = obj.x + offsetX;
            const newY = obj.y + offsetY;

            if (newX >= 0 && (newX * GRID_CONSTANTS.TILE_SIZE) < (newWidth * GRID_CONSTANTS.TILE_SIZE) && newY >= 0 && (newY * GRID_CONSTANTS.TILE_SIZE) < (newHeight * GRID_CONSTANTS.TILE_SIZE)) {
                obj.x = newX;
                obj.y = newY;
                this.objectManager.objects.push(obj);
                newObjectsList.push(obj);
            }
        });
        this.objectManager.render();

        const afterState = {
            width: newWidth,
            height: newHeight,
            tileData: [...this.grid.tileData],
            objects: JSON.parse(JSON.stringify(this.objectManager.getAllObjects()))
        };

        this.history.push(new ResizeCommand(this.grid, this.objectManager, beforeState, afterState));
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
                this.grid.tileData = new Array(this.grid.width * this.grid.height).fill(0);
                decodedTileData.forEach(tile => {
                    const index = tile.y * this.grid.width + tile.x;
                    this.grid.tileData[index] = parseInt(tile.id, 10);
                });
                this.grid.drawAllTiles();
            }

            this.objectManager.load(data);
            this.history.clear();
        });
    }

    _onExport() {
        LevelExporter.export(this.grid, this.objectManager, DOM.levelNameInput.value, DOM.backgroundInput.value);
    }

    _onBack() {
        window.location.href = 'index.html#levels';
    }

    _onCreateLevel() {
        const { startPos, finalEntities } = this.objectManager.getObjectsForExport();
        const levelData = {
            name: DOM.levelNameInput.value || 'My DIY Level',
            gridWidth: this.grid.width,
            gridHeight: this.grid.height,
            background: DOM.backgroundInput.value,
            startPosition: startPos,
            tileData: LevelExporter._encodeTileDataToRLE(this.grid.getTileDataForExport(), this.grid.width, this.grid.height),
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
        this.history.undo();
    }

    _onRedo() {
        this.history.redo();
    }

    _executeAction(action, direction) {
        // This method is now obsolete and will be removed.
        // The new HistoryManager handles this directly.
    }


    selectObject(obj) {
        if (!obj) return;
        this.deselectObject();
        this.state.selectedObject = obj;
        this.objectDragStartPosition = { x: obj.x, y: obj.y };
        this.propertiesPanel.displayObject(obj);
        DOM.gridContainer.querySelector(`.dynamic-object[data-id='${obj.id}']`)?.classList.add('selected');
    }

    deselectObject() {
        if (!this.state.selectedObject) return;
        DOM.gridContainer.querySelector(`.dynamic-object[data-id='${this.state.selectedObject.id}']`)?.classList.remove('selected');
        this.state.selectedObject = null;
        this.propertiesPanel.clear();
    }

    _animationLoop = () => {
        this.marchingAntsOffset = (this.marchingAntsOffset + 0.5) % 10;
        this.grid.overlayCtx.clearRect(0, 0, this.grid.overlayCanvas.width, this.grid.overlayCanvas.height);

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
        const ctx = this.grid.overlayCtx;
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
        const ctx = this.grid.overlayCtx;
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
        const ctx = this.grid.overlayCtx;
        ctx.globalAlpha = 0.6;
        const startX = (this.state.pastePreview.gridX - Math.floor(this.state.clipboard.width / 2)) * TILE_SIZE;
        const startY = (this.state.pastePreview.gridY - Math.floor(this.state.clipboard.height / 2)) * TILE_SIZE;

        for (const tile of this.state.clipboard.tiles) {
            const x = startX + tile.x * TILE_SIZE;
            const y = startY + tile.y * TILE_SIZE;
            const tileId = parseInt(tile.id, 10);
            const isSpecial = tileId > SPECIAL_TILE_ID_OFFSET;
            const sourceImage = isSpecial ? this.palette.specialTileset.image : this.palette.mainTileset.image;
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
                this.objectManager.render();
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
            this.palette.selectTool('select');
        } else {
            this.state.currentTool = { type: 'none' };
            this.palette.updateSelectionVisuals();
            this.propertiesPanel.clear();
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
                const index = (sel.y + y) * this.grid.width + (sel.x + x);
                const tileId = this.grid.getTileId(index);
                if (tileId !== '0') {
                    clipboardData.tiles.push({ x, y, id: tileId });
                }
            }
        }
        clipboardData.objects = this.objectManager.getAllObjects()
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
                    const index = (sel.y + y) * this.grid.width + (sel.x + x);
                    const oldId = this.grid.getTileId(index);
                    if (oldId !== '0') {
                        paintChanges.push({ index, from: oldId, to: '0' });
                        this.grid.paintCell(index, '0');
                    }
                }
            }
            if (paintChanges.length > 0) {
                this.history.push(new PaintCommand(this.grid, paintChanges));
            }

            clipboardData.objects.forEach(objData => {
                const originalObj = this.objectManager.getObject(objData.id);
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
        this.inputHandler.setCursor('none');
        this._clearSelection();
    }

    _onPaste(gridX, gridY) {
        if (!this.state.clipboard) return;

        const startX = gridX - Math.floor(this.state.clipboard.width / 2);
        const startY = gridY - Math.floor(this.state.clipboard.height / 2);
        const paintChanges = [];

        const compositeCommand = new CompositeCommand();

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
                const { newObject } = this.objectManager.addObject(objData.type, newX * GRID_CONSTANTS.TILE_SIZE, newY * GRID_CONSTANTS.TILE_SIZE);
                Object.assign(newObject, { ...objData, id: newObject.id, x: newX, y: newY });

                compositeCommand.add(new PlaceObjectCommand(this.objectManager, newObject));

            }
        });
        this.objectManager.render();

        if (compositeCommand.commands.length > 0) {
            this.history.push(compositeCommand);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    DOM.init();
    const editor = new EditorApp();
    editor.init();
});