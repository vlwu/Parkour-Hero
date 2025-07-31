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

const round = (val) => Math.round(val * 100) / 100;

class EditorController {
    constructor() {

        this.grid = new Grid(28, 15);
        this.objectManager = new ObjectManager(this.grid);
        this.history = new HistoryManager(DOM.undoBtn, DOM.redoBtn);


        this.selectedObject = null;
        this.objectDragStartPosition = null;
        this.currentPaintAction = null;
        this.objectPropChange = {
            isChanging: false,
            oldValue: 0
        };
        this.editingLevelIndex = null;

        this.assets = null;
        this.fontRenderer = null;
        this.engine = null;


        this.palette = new Palette(this._onPaletteSelection.bind(this));
        this.propertiesPanel = new PropertiesPanel(this._onPropertyUpdate.bind(this));


        this.inputHandler = new GridInputHandler(DOM.gridContainer, this.grid, {
            isTileSelected: () => this.palette.getSelection().type === 'tile',
            onPaintStart: this._onPaintStart.bind(this),
            onPaint: this._onPaint.bind(this),
            onErase: (index) => this._onPaint(index, '0'),
            onPaintEnd: this._onPaintEnd.bind(this),
            onObjectPlace: this._onObjectPlace.bind(this),
            onObjectDelete: this._onObjectDelete.bind(this),
            onObjectDragStart: this._onObjectDragStart.bind(this),
            onObjectDrag: this._onObjectDrag.bind(this),
            onObjectDragEnd: this._onObjectDragEnd.bind(this),
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
        });
        window.addEventListener('resize', () => this.grid.autoFitScale());
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); this._onUndo(); }
            if (e.ctrlKey && e.key.toLowerCase() === 'y') { e.preventDefault(); this._onRedo(); }
        });
        this._onPaletteSelection(this.palette.getSelection());
        this._loadGameAssets();
        this._setupResizeModalListeners();
        this._checkForEditMode();
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
                    decodedTileData.forEach(tile => {
                        const index = tile.y * this.grid.width + tile.x;
                        this.grid.paintCell(index, tile.id);
                    });

                    levelData.tileData = decodedTileData;
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

        this.engine = new Engine(gl, gameCanvas, ctx, this.assets, {}, this.fontRenderer, assetManager);
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

            this.engine.render(deltaTime, 1.0);


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
        this.propertiesPanel.showItemDescription(selection.type, selection.id);
    }

    _onPropertyUpdate(id, prop, value, type) {
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
                this.history.push({ type: 'update_prop', id, prop, from: oldValue, to: finalValue });
            } else {
                 this.objectManager.updateObjectProp(id, prop, finalValue);
            }
        }
    }

    _onPaintStart() {
        this.currentPaintAction = { type: 'paint', changes: [] };
    }

    _onPaint(index, tileId = null) {
        if (!this.currentPaintAction) return;
        tileId = tileId ?? this.palette.getSelection().id;
        const oldId = this.grid.getTileId(index);
        if (oldId !== tileId && !this.currentPaintAction.changes.some(c => c.index === index)) {
            this.currentPaintAction.changes.push({ index, from: oldId, to: tileId });
            this.grid.paintCell(index, tileId);
        }
    }

    _onPaintEnd() {
        if (this.currentPaintAction && this.currentPaintAction.changes.length > 0) {
            this.history.push(this.currentPaintAction);
        }
        this.currentPaintAction = null;
    }

    _onObjectPlace(pixelX, pixelY) {
        const selection = this.palette.getSelection();
        const type = selection.id;
        const { newObject, replacedSpawn } = this.objectManager.addObject(type, pixelX, pixelY);
        const action = { type: 'place_object', obj: newObject };
        if (replacedSpawn) { action.replaced = replacedSpawn; }
        this.history.push(action);
        this.selectObject(newObject);
    }

    _onObjectDelete(id) {
        const objectToDelete = this.objectManager.getObject(id);
        if (!objectToDelete) return;
        if (objectToDelete.type === 'player_spawn') {
            alert('The Player Spawn cannot be deleted. To move it, simply left-click and drag it to a new position.');
            return;
        }
        this.history.push({ type: 'delete_object', obj: objectToDelete });
        if (this.selectedObject && this.selectedObject.id === id) { this.deselectObject(); }
        this.objectManager.deleteObject(id);
    }

    _onObjectDragStart(id) {
        const obj = this.objectManager.getObject(id);
        this.selectObject(obj);
        return { x: obj.x, y: obj.y };
    }

    _onObjectDrag(id, newX, newY) {
        this.objectManager.updateObjectProp(id, 'x', newX);
        this.objectManager.updateObjectProp(id, 'y', newY);
        this.propertiesPanel.displayObject(this.objectManager.getObject(id));
    }

    _onObjectDragEnd(id) {
        const obj = this.objectManager.getObject(id);
        this.objectManager._applySnapping(obj);
        this.objectManager._updateGroundedEnemyBehavior(obj);

        const finalX = round(obj.x);
        const finalY = round(obj.y);
        const initial = this.objectDragStartPosition;

        if (initial && (initial.x !== finalX || initial.y !== finalY)) {
            this.history.push({
                type: 'move_object', id,
                from: { x: initial.x, y: initial.y },
                to: { x: finalX, y: finalY }
            });
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
        const oldTileData = this.grid.getTileDataForExport();
        const oldObjects = JSON.parse(JSON.stringify(this.objectManager.getAllObjects()));

        const dx = newWidth - oldWidth;
        const dy = newHeight - oldHeight;

        let offsetX = 0;
        let offsetY = 0;

        if (anchor.includes('right')) offsetX = -dx;
        else if (anchor.includes('center')) offsetX = -dx / 2;

        if (anchor.includes('bottom')) offsetY = -dy;
        else if (anchor.includes('middle')) offsetY = -dy / 2;

        this.grid.resize(newWidth, newHeight);

        const newTileData = [];
        oldTileData.forEach(tile => {
            const newX = tile.x + offsetX;
            const newY = tile.y + offsetY;
            if (newX >= 0 && newX < newWidth && newY >= 0 && newY < newHeight) {
                const index = newY * newWidth + newX;
                this.grid.paintCell(index, tile.id);
                newTileData.push({ x: newX, y: newY, id: tile.id });
            }
        });

        const newObjects = [];
        this.objectManager.clear();
        oldObjects.forEach(obj => {
            const newX = obj.x + offsetX;
            const newY = obj.y + offsetY;

            if (newX >= 0 && newX < newWidth && newY >= 0 && newY < newHeight) {
                obj.x = newX;
                obj.y = newY;
                this.objectManager.objects.push(obj);
                newObjects.push(obj);
            }
        });
        this.objectManager.render();
    }

    _onFileLoad(e) {
        const file = e.target.files[0];
        LevelImporter.load(file, (data) => {
            this.resetEditor(data.gridWidth, data.gridHeight);
            DOM.levelNameInput.value = data.name;
            DOM.backgroundInput.value = data.background || 'background_blue';

            if (data.tileData) {
                data.tileData.forEach(tile => {
                    const index = tile.y * this.grid.width + tile.x;
                    this.grid.paintCell(index, tile.id);
                });
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
            tileData: this.grid.getTileDataForExport(),
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
        const action = this.history.undo();
        if (action) this._executeAction(action, 'undo');
    }

    _onRedo() {
        const action = this.history.redo();
        if (action) this._executeAction(action, 'redo');
    }

    _executeAction(action, direction) {
        const isUndo = direction === 'undo';
        switch (action.type) {
            case 'paint':
                action.changes.forEach(c => this.grid.paintCell(c.index, isUndo ? c.from : c.to)); break;
            case 'place_object':
                if (isUndo) {
                    this.objectManager.deleteObject(action.obj.id);
                    if(action.replaced) this.objectManager.objects.push(action.replaced);
                } else {
                    if(action.replaced) this.objectManager.deleteObject(action.replaced.id);
                    this.objectManager.objects.push(action.obj);
                }
                this.objectManager.render(); break;
            case 'delete_object':
                if (isUndo) this.objectManager.objects.push(action.obj);
                else this.objectManager.deleteObject(action.obj.id);
                this.objectManager.render(); break;
            case 'move_object':
                const movedObj = this.objectManager.getObject(action.id);
                if (movedObj) {
                    const pos = isUndo ? action.from : action.to;
                    movedObj.x = pos.x; movedObj.y = pos.y;
                    this.objectManager._updateGroundedEnemyBehavior(movedObj);
                    this.objectManager.render();
                    if (this.selectedObject?.id === action.id) this.propertiesPanel.displayObject(movedObj);
                }
                break;
            case 'update_prop':
                const propObj = this.objectManager.getObject(action.id);
                if (propObj) {
                    propObj[action.prop] = isUndo ? action.from : action.to;
                    this.objectManager.render();
                    if (this.selectedObject?.id === action.id) this.propertiesPanel.displayObject(propObj);
                }
                break;
        }
    }

    selectObject(obj) {
        if (!obj) return;
        this.deselectObject();
        this.selectedObject = obj;
        this.objectDragStartPosition = { x: obj.x, y: obj.y };
        this.propertiesPanel.displayObject(obj);
        DOM.gridContainer.querySelector(`.dynamic-object[data-id='${obj.id}']`)?.classList.add('selected');
    }

    deselectObject() {
        if (!this.selectedObject) return;
        DOM.gridContainer.querySelector(`.dynamic-object[data-id='${this.selectedObject.id}']`)?.classList.remove('selected');
        this.selectedObject = null;
        this.propertiesPanel.clear();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    DOM.init();
    const editor = new EditorController();
    editor.init();
});