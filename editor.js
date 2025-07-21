import { TILE_DEFINITIONS } from './src/entities/tile-definitions.js';
import { GRID_CONSTANTS } from './src/utils/constants.js';

// --- UTILITY FUNCTIONS ---
const round = (val) => Math.round(val * 100) / 100;

// DOM Elements
const gridContainer = document.getElementById('grid-container');
const terrainPaletteContainer = document.getElementById('terrain-palette');
const itemsPaletteContainer = document.getElementById('items-palette');
const trapsPaletteContainer = document.getElementById('traps-palette');
const propertiesPanel = document.getElementById('properties-panel');
const levelNameInput = document.getElementById('levelNameInput');
const backgroundInput = document.getElementById('backgroundInput');
const loadFileInput = document.getElementById('loadFile');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

// Editor State
let gridWidth = 28, gridHeight = 15;
let isPainting = false, isErasing = false, isDragging = false;
let selectedPaletteItem = { type: 'tile', id: '1' };
let dynamicObjects = [], selectedObject = null, draggedObject = null;
let nextObjectId = 0;
let dragStartX, dragStartY, dragInitialX, dragInitialY;

// History State
let historyStack = [], redoStack = [];
let currentPaintAction = null;

// Data Maps for Editor
const OBJECT_DESCRIPTIONS = {
    'player_spawn': 'The player\'s starting position. Only one can be placed per level. Left-click and drag to move.',
    'fruit_apple': 'A standard collectible fruit.', 'fruit_bananas': 'A standard collectible fruit.',
    'fruit_cherries': 'A standard collectible fruit.', 'fruit_kiwi': 'A standard collectible fruit.',
    'fruit_melon': 'A standard collectible fruit.', 'fruit_orange': 'A standard collectible fruit.',
    'fruit_pineapple': 'A standard collectible fruit.', 'fruit_strawberry': 'A standard collectible fruit.',
    'trophy': 'The level\'s goal. Becomes active once all fruits are collected. Snaps to the ground.',
    'checkpoint': 'Saves the player\'s progress. The player will respawn here upon death. Snaps to the ground.',
    'trampoline': 'Bounces the player high into the air. Snaps to the ground.',
    'spike': 'A dangerous spike. Lethal to the touch. Snaps to the ground.',
    'fire_trap': 'A block that erupts in flame when stepped on. Snaps to the ground.'
};

const PALETTE_ABBREVIATIONS = {
    // Items
    'player_spawn': 'SPN',
    'fruit_apple': 'APL', 'fruit_bananas': 'BAN', 'fruit_cherries': 'CHR',
    'fruit_kiwi': 'KWI', 'fruit_melon': 'MEL', 'fruit_orange': 'ORG',
    'fruit_pineapple': 'PNP', 'fruit_strawberry': 'STR',
    'trophy': 'GOL', 'checkpoint': 'CHK',
    // Traps
    'trampoline': 'TRP', 'spike': 'SPK', 'fire_trap': 'FIR',
    // Terrain
    'empty': 'ERS', 'dirt': 'DRT', 'stone': 'STN', 'wood': 'WOD',
    'green_block': 'GRN', 'orange_dirt': 'ODT', 'pink_dirt': 'PDT',
    'sand': 'SND', 'mud': 'MUD', 'ice': 'ICE'
};

// --- INITIALIZATION ---

function init() {
    setupEventListeners();
    populatePalettes();
    generateGrid();
    updatePaletteSelection();
    showDescription('tile', '1');
    updateUndoRedoButtons();
}

function setupEventListeners() {
    document.getElementById('newBtn').addEventListener('click', () => { resetEditor(28, 15); });
    document.getElementById('resizeBtn').addEventListener('click', resizeGrid);
    document.getElementById('loadBtn').addEventListener('click', () => loadFileInput.click());
    document.getElementById('exportBtn').addEventListener('click', exportLevelJSON);
    loadFileInput.addEventListener('change', handleFileLoad);

    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);

    gridContainer.addEventListener('mousedown', handleGridMouseDown);
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
    gridContainer.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
        if (e.ctrlKey && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    });
}

function resetEditor(width, height) {
    gridWidth = width;
    gridHeight = height;
    dynamicObjects = [];
    historyStack = [];
    redoStack = [];
    generateGrid();
    updateUndoRedoButtons();
}

// --- HISTORY (UNDO/REDO) ---

function pushToHistory(action) {
    historyStack.push(action);
    redoStack = []; 
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    undoBtn.disabled = historyStack.length === 0;
    redoBtn.disabled = redoStack.length === 0;
}

function undo() {
    if (historyStack.length === 0) return;
    const action = historyStack.pop();
    redoStack.push(JSON.parse(JSON.stringify(action)));

    switch (action.type) {
        case 'paint':
            action.changes.forEach(c => paintCell(gridContainer.children[c.index], c.from));
            break;
        case 'place_object':
            if (action.obj.type === 'player_spawn' && action.replaced) {
                dynamicObjects.push(action.replaced);
            }
            dynamicObjects = dynamicObjects.filter(o => o.id !== action.obj.id);
            if (selectedObject && selectedObject.id === action.obj.id) deselectObject();
            break;
        case 'delete_object':
            dynamicObjects.push(action.obj);
            break;
        case 'move_object':
            const movedObj = dynamicObjects.find(o => o.id === action.id);
            if (movedObj) {
                movedObj.x = action.from.x;
                movedObj.y = action.from.y;
            }
            break;
    }
    renderDynamicObjects();
    updateUndoRedoButtons();
}

function redo() {
    if (redoStack.length === 0) return;
    const action = redoStack.pop();
    historyStack.push(JSON.parse(JSON.stringify(action)));

    switch (action.type) {
        case 'paint':
            action.changes.forEach(c => paintCell(gridContainer.children[c.index], c.to));
            break;
        case 'place_object':
            if (action.obj.type === 'player_spawn') {
                dynamicObjects = dynamicObjects.filter(o => o.type !== 'player_spawn');
            }
            dynamicObjects.push(action.obj);
            break;
        case 'delete_object':
            dynamicObjects = dynamicObjects.filter(o => o.id !== action.obj.id);
            if (selectedObject && selectedObject.id === action.obj.id) deselectObject();
            break;
        case 'move_object':
            const movedObj = dynamicObjects.find(o => o.id === action.id);
            if (movedObj) {
                movedObj.x = action.to.x;
                movedObj.y = action.to.y;
            }
            break;
    }
    renderDynamicObjects();
    updateUndoRedoButtons();
}

// --- PALETTE & DESCRIPTIONS ---

function getPaletteColor(type) {
    switch (type) {
        case 'dirt': case 'orange_dirt': case 'pink_dirt': return '#8B4513';
        case 'stone': return '#6c757d'; case 'wood': return '#A0522D';
        case 'green_block': return '#28a745'; case 'sand': return '#F4A460';
        case 'mud': return '#5D4037'; case 'ice': return '#5DADE2';
        case 'trampoline': return '#8e44ad';
        case 'spike': return '#3c3c3cff';
        case 'fire_trap': return '#941b00ff';
        case 'fruit_apple': return '#e74c3c';
        case 'fruit_bananas': return '#f1c40f';
        case 'fruit_cherries': return '#c0392b';
        case 'fruit_kiwi': return '#27ae60';
        case 'fruit_melon': return '#1abc9c';
        case 'fruit_orange': return '#e67e22';
        case 'fruit_pineapple': return '#f39c12';
        case 'fruit_strawberry': return '#d35400';
        case 'player_spawn': return '#2980b9';
        case 'trophy': return '#F39C12'; case 'checkpoint': return '#17a2b8';
        case 'empty': return 'rgba(0,0,0,0.3)'; default: return '#34495e';
    }
}

function populatePalettes() {
    // Terrain
    for (const [id, def] of Object.entries(TILE_DEFINITIONS)) {
        const abbreviation = PALETTE_ABBREVIATIONS[def.type] || '???';
        const item = createPaletteItem('tile', id, def.type, def.description, abbreviation);
        item.style.backgroundColor = getPaletteColor(def.type);
        terrainPaletteContainer.appendChild(item);
    }
    
    // Items
    const itemTypes = [ 'player_spawn', 'fruit_apple', 'fruit_bananas', 'fruit_cherries', 'fruit_kiwi', 'fruit_melon', 'fruit_orange', 'fruit_pineapple', 'fruit_strawberry', 'checkpoint', 'trophy' ];
    itemTypes.forEach(type => {
        const abbreviation = PALETTE_ABBREVIATIONS[type] || '???';
        const item = createPaletteItem('object', type, type.replace(/_/g, ' '), OBJECT_DESCRIPTIONS[type], abbreviation);
        item.style.backgroundColor = getPaletteColor(type);
        itemsPaletteContainer.appendChild(item);
    });

    // Traps
    const trapTypes = ['spike', 'fire_trap', 'trampoline'];
    trapTypes.forEach(type => {
        const abbreviation = PALETTE_ABBREVIATIONS[type] || '???';
        const item = createPaletteItem('object', type, type.replace(/_/g, ' '), OBJECT_DESCRIPTIONS[type], abbreviation);
        item.style.backgroundColor = getPaletteColor(type);
        trapsPaletteContainer.appendChild(item);
    });
}


function createPaletteItem(type, id, title, description, abbreviation) {
    const item = document.createElement('div');
    item.className = 'palette-item';
    item.dataset.type = type;
    item.dataset.id = id;
    item.title = title;
    
    item.textContent = abbreviation;
    item.style.color = '#fff';
    item.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
    item.style.fontSize = '12px';
    
    item.addEventListener('click', () => {
        selectedPaletteItem = { type, id };
        updatePaletteSelection();
        deselectObject();
        showDescription(type, id);
    });
    return item;
}

function updatePaletteSelection() {
    document.querySelectorAll('.palette-item').forEach(el => {
        const isSelected = el.dataset.type === selectedPaletteItem.type && el.dataset.id === selectedPaletteItem.id;
        el.classList.toggle('selected', isSelected);
    });
}

function showDescription(itemType, itemId) {
    let title = '', description = '';
    if (itemType === 'tile') {
        const def = TILE_DEFINITIONS[itemId];
        title = def.type.replace(/_/g, ' ');
        description = def.description;
    } else {
        title = itemId.replace(/_/g, ' ');
        description = OBJECT_DESCRIPTIONS[itemId];
    }
    propertiesPanel.innerHTML = `<h3 class="properties-title">${title}</h3><p class="properties-description">${description || 'No description available.'}</p>`;
}

// --- GRID, PAINTING, & DRAGGING ---

function generateGrid() {
    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${gridWidth}, ${GRID_CONSTANTS.TILE_SIZE}px)`;
    gridContainer.style.width = `${gridWidth * GRID_CONSTANTS.TILE_SIZE}px`;
    gridContainer.style.height = `${gridHeight * GRID_CONSTANTS.TILE_SIZE}px`;
    for (let i = 0; i < gridWidth * gridHeight; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.tileId = '0';
        cell.dataset.index = i;
        gridContainer.appendChild(cell);
    }
    renderDynamicObjects();
}

function resizeGrid() {
    const newWidth = parseInt(prompt("Enter new grid width:", gridWidth));
    const newHeight = parseInt(prompt("Enter new grid height:", gridHeight));
    if (!isNaN(newWidth) && !isNaN(newHeight) && newWidth > 0 && newHeight > 0) {
        resetEditor(newWidth, newHeight);
    }
}

function handleGridMouseDown(e) {
    const target = e.target;
    if (target.classList.contains('grid-cell')) {
        const rect = gridContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        if (e.button === 0) { // Left-click
            if (selectedPaletteItem.type === 'tile') {
                isPainting = true;
                currentPaintAction = { type: 'paint', changes: [] };
                tryPaintCell(target, selectedPaletteItem.id);
            } else {
                placeObject(clickX, clickY, selectedPaletteItem.id);
            }
        } else if (e.button === 2) { // Right-click
            isErasing = true;
            currentPaintAction = { type: 'paint', changes: [] };
            tryPaintCell(target, '0');
        }
    } else if (target.classList.contains('dynamic-object')) {
        if (e.button === 0) { // Left-click to start drag
            isDragging = true;
            draggedObject = dynamicObjects.find(o => o.id === parseInt(target.dataset.id));
            selectObject(draggedObject);
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragInitialX = draggedObject.x;
            dragInitialY = draggedObject.y;
            target.classList.add('dragging');
        } else if (e.button === 2) { // Right-click to delete
            deleteObject(parseInt(target.dataset.id));
        }
    }
}

function handleDocumentMouseMove(e) {
    if (isDragging && draggedObject) {
        const dx = (e.clientX - dragStartX) / GRID_CONSTANTS.TILE_SIZE;
        const dy = (e.clientY - dragStartY) / GRID_CONSTANTS.TILE_SIZE;
        draggedObject.x = dragInitialX + dx;
        draggedObject.y = dragInitialY + dy;
        renderDynamicObjects();
    } else if (isPainting || isErasing) {
        if (e.target.classList.contains('grid-cell')) {
            tryPaintCell(e.target, isErasing ? '0' : selectedPaletteItem.id);
        }
    }
}

function handleDocumentMouseUp(e) {
    if (isPainting || isErasing) {
        if (currentPaintAction && currentPaintAction.changes.length > 0) {
            pushToHistory(currentPaintAction);
        }
    }
    if (isDragging && draggedObject) {
        snapObjectToGround(draggedObject);
        
        const finalX = round(draggedObject.x);
        const finalY = round(draggedObject.y);
        
        if (dragInitialX !== finalX || dragInitialY !== finalY) {
            pushToHistory({ type: 'move_object', id: draggedObject.id, from: { x: dragInitialX, y: dragInitialY }, to: { x: finalX, y: finalY } });
        }
        
        draggedObject.x = finalX;
        draggedObject.y = finalY;

        document.querySelector('.dynamic-object.dragging')?.classList.remove('dragging');
        selectObject(draggedObject);
    }
    isPainting = isErasing = isDragging = false;
    currentPaintAction = null; draggedObject = null;
}

function tryPaintCell(cell, tileId) {
    const oldId = cell.dataset.tileId;
    if (oldId === tileId) return;
    if (!currentPaintAction.changes.some(c => c.index === parseInt(cell.dataset.index))) {
        currentPaintAction.changes.push({ index: parseInt(cell.dataset.index), from: oldId, to: tileId });
    }
    paintCell(cell, tileId);
}

function paintCell(cell, tileId) {
    cell.dataset.tileId = tileId;
    const def = TILE_DEFINITIONS[tileId];
    cell.style.backgroundColor = getPaletteColor(def.type);
}

// --- DYNAMIC OBJECTS & PROPERTIES PANEL ---

function snapObjectToGround(obj) {
    const snappableTypes = ['trophy', 'checkpoint', 'trampoline', 'spike', 'fire_trap'];
    if (!snappableTypes.includes(obj.type)) {
        return;
    }

    const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
    const maxSnapPixels = TILE_SIZE * 1.5;

    const objCenterX_px = obj.x * TILE_SIZE;
    const objCenterY_px = obj.y * TILE_SIZE;
    const objBottomY_px = objCenterY_px + obj.size / 2;

    const gridX = Math.floor(objCenterX_px / TILE_SIZE);
    const startGridY = Math.floor(objBottomY_px / TILE_SIZE);

    for (let y = startGridY; y < gridHeight && y < startGridY + 3; y++) {
        if (y < 0) continue;
        const index = y * gridWidth + gridX;
        const cell = gridContainer.children[index];
        if (!cell) continue;

        const tileId = cell.dataset.tileId;
        const tileDef = TILE_DEFINITIONS[tileId];

        if (tileDef && tileDef.solid) {
            const platformTop_px = y * TILE_SIZE;
            const distance = platformTop_px - objBottomY_px;

            if (distance >= -TILE_SIZE / 2 && distance < maxSnapPixels) {
                const newCenterY_px = platformTop_px - obj.size / 2;
                obj.y = newCenterY_px / TILE_SIZE;
                return;
            }
        }
    }
}

function getObjectSize(type) {
    if (type === 'checkpoint') return 64;
    if (type === 'trophy') return 32;
    if (type === 'player_spawn') return 32;
    if (type === 'trampoline') return 28;
    if (type === 'spike') return 16;
    if (type === 'fire_trap') return 16;
    return 28; // Default for fruits
}

function placeObject(pixelX, pixelY, type) {
    let historyAction = { type: 'place_object' };
    let replacedSpawn = null;
    
    if (type === 'player_spawn') {
        const existingSpawnIndex = dynamicObjects.findIndex(o => o.type === 'player_spawn');
        if (existingSpawnIndex > -1) {
            replacedSpawn = dynamicObjects.splice(existingSpawnIndex, 1)[0];
            historyAction.replaced = replacedSpawn;
        }
    }
    
    const newObject = {
        id: nextObjectId++,
        type: type,
        x: pixelX / GRID_CONSTANTS.TILE_SIZE,
        y: pixelY / GRID_CONSTANTS.TILE_SIZE,
        size: getObjectSize(type)
    };
    
    snapObjectToGround(newObject);
    newObject.x = round(newObject.x);
    newObject.y = round(newObject.y);
    
    historyAction.obj = JSON.parse(JSON.stringify(newObject));
    pushToHistory(historyAction);

    dynamicObjects.push(newObject);
    renderDynamicObjects();
    selectObject(newObject);
}

function renderDynamicObjects() {
    gridContainer.querySelectorAll('.dynamic-object').forEach(el => el.remove());
    dynamicObjects.forEach(obj => {
        const el = document.createElement('div');
        el.className = 'dynamic-object';
        el.dataset.id = obj.id;
        el.style.width = `${obj.size}px`; el.style.height = `${obj.size}px`;
        el.style.left = `${obj.x * GRID_CONSTANTS.TILE_SIZE - (obj.size / 2)}px`;
        el.style.top = `${obj.y * GRID_CONSTANTS.TILE_SIZE - (obj.size / 2)}px`;
        el.title = obj.type; el.style.backgroundColor = getPaletteColor(obj.type);
        el.style.opacity = '0.8';
        
        if (obj.type === 'player_spawn') {
            el.innerHTML = '<span style="color: white; font-weight: bold; font-size: 18px;">P</span>';
            el.style.display = 'flex';
            el.style.justifyContent = 'center';
            el.style.alignItems = 'center';
        }
        
        el.addEventListener('mousedown', (e) => { if (e.button === 0) { selectObject(obj, e); }});
        gridContainer.appendChild(el);
    });
}

function selectObject(obj) {
    selectedObject = obj;
    propertiesPanel.innerHTML = `<h3 class="properties-title">${obj.type.replace(/_/g, ' ')} (ID: ${obj.id})</h3><label for="prop-x">Grid X:</label><input type="number" id="prop-x" step="0.01" value="${obj.x.toFixed(2)}"><label for="prop-y">Grid Y:</label><input type="number" id="prop-y" step="0.01" value="${obj.y.toFixed(2)}">`;
    document.getElementById('prop-x').addEventListener('input', e => updateObjectProp(obj.id, 'x', parseFloat(e.target.value)));
    document.getElementById('prop-y').addEventListener('input', e => updateObjectProp(obj.id, 'y', parseFloat(e.target.value)));
    document.querySelectorAll('.dynamic-object').forEach(el => el.classList.remove('selected'));
    const objEl = gridContainer.querySelector(`.dynamic-object[data-id='${obj.id}']`);
    if (objEl) objEl.classList.add('selected');
}

function deselectObject() {
    if (!selectedObject) return;
    const objEl = gridContainer.querySelector(`.dynamic-object[data-id='${selectedObject.id}']`);
    if (objEl) objEl.classList.remove('selected');
    selectedObject = null;
    propertiesPanel.innerHTML = `<p>Select an object or palette item for info.</p>`;
}

function updateObjectProp(id, prop, value) {
    const obj = dynamicObjects.find(o => o.id === id);
    if (obj && !isNaN(value)) {
        obj[prop] = round(value);
        renderDynamicObjects();
        const objEl = gridContainer.querySelector(`.dynamic-object[data-id='${id}']`);
        if (objEl) objEl.classList.add('selected');
    }
}

function deleteObject(id) {
    const objToDelete = dynamicObjects.find(o => o.id === id);
    if (!objToDelete) return;

    if (objToDelete.type === 'player_spawn') {
        alert('The Player Spawn cannot be deleted. To move it, simply left-click and drag it to a new position.');
        return;
    }

    pushToHistory({ type: 'delete_object', obj: JSON.parse(JSON.stringify(objToDelete)) });
    dynamicObjects = dynamicObjects.filter(obj => obj.id !== id);
    if (selectedObject && selectedObject.id === id) deselectObject();
    renderDynamicObjects();
}

// --- FILE I/O & CONVERSION ---

function handleFileLoad(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const levelData = JSON.parse(event.target.result);
            if (levelData.gridWidth) { loadGridLevel(levelData); }
            else if (levelData.platforms) { alert('Old level format detected. Conversion is no longer supported due to the new trap system.'); }
            else { alert('Unrecognized level format.'); }
        } catch (err) { alert('Error parsing JSON file: ' + err.message); }
    };
    reader.readAsText(file); e.target.value = null;
}

function loadGridLevel(data) {
    resetEditor(data.gridWidth, data.gridHeight);
    levelNameInput.value = data.name;
    backgroundInput.value = data.background || 'background_blue';
    data.layout.forEach((rowString, y) => {
        [...rowString].forEach((tileId, x) => {
            const index = y * gridWidth + x;
            if (gridContainer.children[index]) { paintCell(gridContainer.children[index], tileId); }
        });
    });
    
    dynamicObjects = (data.objects || []).map((obj, i) => ({ ...obj, id: i, size: getObjectSize(obj.type) }));
    nextObjectId = dynamicObjects.length;

    if (data.startPosition) {
        const spawnObject = {
            id: nextObjectId++,
            type: 'player_spawn',
            x: data.startPosition.x,
            y: data.startPosition.y,
            size: getObjectSize('player_spawn')
        };
        dynamicObjects.push(spawnObject);
    }

    renderDynamicObjects();
    historyStack = []; redoStack = []; updateUndoRedoButtons();
}

function exportLevelJSON() {
    const layout = []; let rowString = '';
    for (let i = 0; i < gridContainer.children.length; i++) {
        rowString += gridContainer.children[i].dataset.tileId;
        if ((i + 1) % gridWidth === 0) { layout.push(rowString); rowString = ''; }
    }
    
    const playerSpawnObj = dynamicObjects.find(obj => obj.type === 'player_spawn');
    const startPos = playerSpawnObj
        ? { x: round(playerSpawnObj.x), y: round(playerSpawnObj.y) }
        : { x: 1.5, y: gridHeight - 2.5 }; 

    const finalObjects = dynamicObjects
        .filter(obj => obj.type !== 'player_spawn')
        .map(({ id, size, ...rest }) => ({...rest, x: round(rest.x), y: round(rest.y)}));
    
    const exportData = {
        name: levelNameInput.value, gridWidth: gridWidth, gridHeight: gridHeight,
        background: backgroundInput.value, 
        startPosition: startPos,
        layout: layout, 
        objects: finalObjects
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${levelNameInput.value.replace(/\s/g, '-')}.json`);
    dlAnchorElem.click(); dlAnchorElem.remove();
}

// --- START THE EDITOR ---
init();