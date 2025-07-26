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
import { loadAssets } from '../managers/asset-manager.js';
import { FontRenderer } from '../ui/font-renderer.js';
import '../ui/ui-main.js';

const round = (val) => Math.round(val * 100) / 100;

class EditorController {
    constructor() {
        // Core Modules
        this.grid = new Grid(28, 15);
        this.objectManager = new ObjectManager(this.grid);
        this.history = new HistoryManager(DOM.undoBtn, DOM.redoBtn);

        // State Management
        this.selectedObject = null;
        this.currentPaintAction = null;
        this.objectPropChange = {
            isChanging: false,
            oldValue: 0
        };
        
        this.assets = null;
        this.fontRenderer = null;
        this.engine = null;

        // UI Modules
        this.palette = new Palette(this._onPaletteSelection.bind(this));
        this.propertiesPanel = new PropertiesPanel(this._onPropertyUpdate.bind(this));
        
        // Input Handler
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
        });
        window.addEventListener('resize', () => this.grid.autoFitScale());
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); this._onUndo(); }
            if (e.ctrlKey && e.key.toLowerCase() === 'y') { e.preventDefault(); this._onRedo(); }
        });
        this._onPaletteSelection(this.palette.getSelection());
        this._loadGameAssets();
    }
    
    async _loadGameAssets() {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'editor-loading-overlay';
        loadingOverlay.textContent = 'Loading Game Assets...';
        document.body.appendChild(loadingOverlay);

        try {
            this.assets = await loadAssets();
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

        const { startPos, finalObjects, finalEnemies } = this.objectManager.getObjectsForExport();
        const levelData = {
            name: `Preview: ${DOM.levelNameInput.value}`,
            gridWidth: this.grid.width,
            gridHeight: this.grid.height,
            background: DOM.backgroundInput.value,
            startPosition: startPos,
            layout: this.grid.getLayout(),
            objects: finalObjects,
            enemies: finalEnemies,
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

        const keybinds = { moveLeft: 'a', moveRight: 'd', jump: 'w', dash: ' ' };
        this.engine = new Engine(ctx, gl, gameCanvas, this.assets, keybinds, this.fontRenderer);
        
        const uiComponent = document.createElement('parkour-hero-ui');
        uiComponent.fontRenderer = this.fontRenderer;
        uiComponent.previewMode = true;
        uiRoot.appendChild(uiComponent);

        this.engine.loadLevelFromData(levelData);
        previewContainer.style.display = 'flex';
        
        const exitPreview = () => {
            this.engine.destroy();
            this.engine = null;
            previewContainer.style.display = 'none';
            uiRoot.innerHTML = '';
            exitBtn.removeEventListener('click', exitPreview);
            window.removeEventListener('resize', resizePreview);
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
        this.objectManager._updateGroundedEnemyBehavior(obj); // Corrected function name
        
        const finalX = round(obj.x);
        const finalY = round(obj.y);
        const initial = this.selectedObject.initialDragPos;

        if (initial && (initial.x !== finalX || initial.y !== finalY)) {
            this.history.push({
                type: 'move_object', id,
                from: { x: initial.x, y: initial.y },
                to: { x: finalX, y: finalY }
            });
        }
        
        obj.x = finalX; obj.y = finalY;
        this.objectManager.render();
        this.propertiesPanel.displayObject(obj);
    }
    
    _onResize() {
        const w = parseInt(prompt("Enter new grid width:", this.grid.width));
        const h = parseInt(prompt("Enter new grid height:", this.grid.height));
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) { this.resetEditor(w, h); }
    }

    _onFileLoad(e) {
        const file = e.target.files[0];
        LevelImporter.load(file, (data) => {
            this.resetEditor(data.gridWidth, data.gridHeight);
            DOM.levelNameInput.value = data.name;
            DOM.backgroundInput.value = data.background || 'background_blue';
            data.layout.forEach((rowString, y) => {
                [...rowString].forEach((tileId, x) => {
                    const index = y * this.grid.width + x;
                    this.grid.paintCell(index, tileId);
                });
            });
            this.objectManager.load(data.objects, data.enemies, data.startPosition);
            this.history.clear();
        });
    }

    _onExport() {
        LevelExporter.export(this.grid, this.objectManager, DOM.levelNameInput.value, DOM.backgroundInput.value);
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
                    this.objectManager._updateGroundedEnemyBehavior(movedObj); // Also update on undo/redo
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
        this.selectedObject.initialDragPos = { x: obj.x, y: obj.y };
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

// --- Start the Editor ---
document.addEventListener('DOMContentLoaded', () => {
    DOM.init(); // Initialize DOM references
    const editor = new EditorController();
    editor.init(); // Initialize the rest of the editor
});