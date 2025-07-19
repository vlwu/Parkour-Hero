// editor.js
import { TILE_DEFINITIONS } from './src/entities/tile-definitions.js';
import { GRID_CONSTANTS } from './src/utils/constants.js';
import { levelSections } from './src/entities/level-definitions.js';

// DOM Elements
const gridContainer = document.getElementById('grid-container');
const tilePaletteContainer = document.getElementById('tile-palette');
const objectPaletteContainer = document.getElementById('object-palette');
const propertiesPanel = document.getElementById('properties-panel');
const levelNameInput = document.getElementById('levelNameInput');
const backgroundInput = document.getElementById('backgroundInput');
const loadFileInput = document.getElementById('loadFile');

// Editor State
let gridWidth = 28;
let gridHeight = 15;
let isPainting = false;
let isErasing = false;
let selectedPaletteItem = { type: 'tile', id: '1' };
let dynamicObjects = [];
let selectedObject = null;
let nextObjectId = 0;

// --- Data Maps for Editor ---
const OBJECT_DESCRIPTIONS = {
    'fruit_apple': 'A standard collectible fruit. The player must gather all fruits in a level to unlock the trophy.',
    'fruit_bananas': 'A standard collectible fruit.',
    'fruit_cherries': 'A standard collectible fruit.',
    'fruit_kiwi': 'A standard collectible fruit.',
    'fruit_melon': 'A standard collectible fruit.',
    'fruit_orange': 'A standard collectible fruit.',
    'fruit_pineapple': 'A standard collectible fruit.',
    'fruit_strawberry': 'A standard collectible fruit.',
    'trophy': 'The level\'s goal. Becomes active once all fruits are collected. The player touching it completes the level.',
    'checkpoint': 'Saves the player\'s progress and collected fruits. The player will respawn here upon death.'
};

// --- INITIALIZATION ---

function init() {
    setupEventListeners();
    populatePalettes();
    generateGrid();
    updatePaletteSelection();
    showDescription('tile', '1');
}

function setupEventListeners() {
    document.getElementById('newBtn').addEventListener('click', () => {
        gridWidth = 28;
        gridHeight = 15;
        dynamicObjects = [];
        generateGrid();
    });
    document.getElementById('resizeBtn').addEventListener('click', resizeGrid);
    document.getElementById('loadBtn').addEventListener('click', () => loadFileInput.click());
    document.getElementById('exportBtn').addEventListener('click', exportLevelJSON);
    loadFileInput.addEventListener('change', handleFileLoad);

    gridContainer.addEventListener('mousedown', handleGridMouseDown);
    gridContainer.addEventListener('mouseup', () => { isPainting = false; isErasing = false; });
    gridContainer.addEventListener('mouseleave', () => { isPainting = false; isErasing = false; });
    gridContainer.addEventListener('mouseover', handleGridMouseOver);
    gridContainer.addEventListener('contextmenu', e => e.preventDefault());
}

// --- PALETTE & DESCRIPTIONS ---

function getPaletteColor(type) {
    switch (type) {
        case 'dirt': case 'orange_dirt': case 'pink_dirt': return '#8B4513';
        case 'stone': return '#6c757d';
        case 'wood': return '#A0522D';
        case 'green_block': return '#28a745';
        case 'sand': return '#F4A460';
        case 'mud': return '#5D4037';
        case 'ice': return '#5DADE2';
        case 'spike_up': return '#e74c3c';
        case 'trampoline': return '#8e44ad';
        case 'fire': return '#f39c12';
        case 'fruit_apple': case 'fruit_bananas': case 'fruit_cherries':
        case 'fruit_kiwi': case 'fruit_melon': case 'fruit_orange':
        case 'fruit_pineapple': case 'fruit_strawberry': return '#f1c40f';
        case 'trophy': return '#F39C12';
        case 'checkpoint': return '#17a2b8';
        case 'empty': return 'rgba(0,0,0,0.3)';
        default: return '#34495e';
    }
}

function populatePalettes() {
    for (const [id, def] of Object.entries(TILE_DEFINITIONS)) {
        const item = createPaletteItem('tile', id, def.type, def.description);
        item.style.backgroundColor = getPaletteColor(def.type);
        if (def.type === 'empty') item.textContent = 'ERASE';
        tilePaletteContainer.appendChild(item);
    }

    const objectTypes = [
        'fruit_apple', 'fruit_bananas', 'fruit_cherries', 'fruit_kiwi',
        'fruit_melon', 'fruit_orange', 'fruit_pineapple', 'fruit_strawberry',
        'checkpoint', 'trophy'
    ];
    objectTypes.forEach(type => {
        const item = createPaletteItem('object', type, type.replace(/_/g, ' '), OBJECT_DESCRIPTIONS[type]);
        item.style.backgroundColor = getPaletteColor(type);
        objectPaletteContainer.appendChild(item);
    });
}

function createPaletteItem(type, id, title, description) {
    const item = document.createElement('div');
    item.className = 'palette-item';
    item.dataset.type = type;
    item.dataset.id = id;
    item.title = title;
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
    let title = '';
    let description = '';

    if (itemType === 'tile') {
        const def = TILE_DEFINITIONS[itemId];
        title = def.type.replace(/_/g, ' ');
        description = def.description;
    } else {
        title = itemId.replace(/_/g, ' ');
        description = OBJECT_DESCRIPTIONS[itemId];
    }

    propertiesPanel.innerHTML = `
        <h3 class="properties-title">${title}</h3>
        <p class="properties-description">${description || 'No description available.'}</p>
    `;
}

// --- GRID & PAINTING ---

function generateGrid() {
    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${gridWidth}, ${GRID_CONSTANTS.TILE_SIZE}px)`;
    gridContainer.style.width = `${gridWidth * GRID_CONSTANTS.TILE_SIZE}px`;
    gridContainer.style.height = `${gridHeight * GRID_CONSTANTS.TILE_SIZE}px`;

    for (let i = 0; i < gridWidth * gridHeight; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.tileId = '0';
        gridContainer.appendChild(cell);
    }
    renderDynamicObjects();
}

function resizeGrid() {
    const newWidth = parseInt(prompt("Enter new grid width:", gridWidth));
    const newHeight = parseInt(prompt("Enter new grid height:", gridHeight));
    if (!isNaN(newWidth) && !isNaN(newHeight) && newWidth > 0 && newHeight > 0) {
        gridWidth = newWidth;
        gridHeight = newHeight;
        dynamicObjects = [];
        generateGrid();
    }
}

function handleGridMouseDown(e) {
    if (e.target.classList.contains('grid-cell')) {
        if (e.button === 0) {
            isPainting = true;
            if (selectedPaletteItem.type === 'tile') {
                paintCell(e.target, selectedPaletteItem.id);
            } else {
                placeObject(e.offsetX, e.offsetY, selectedPaletteItem.id);
            }
        } else if (e.button === 2) {
            isErasing = true;
            paintCell(e.target, '0');
        }
    } else if (e.target.classList.contains('dynamic-object')) {
        if (e.button === 2) {
            deleteObject(parseInt(e.target.dataset.id));
        }
    }
}

function handleGridMouseOver(e) {
    if (!e.target.classList.contains('grid-cell')) return;
    if (isPainting && selectedPaletteItem.type === 'tile') {
        paintCell(e.target, selectedPaletteItem.id);
    } else if (isErasing) {
        paintCell(e.target, '0');
    }
}

function paintCell(cell, tileId) {
    cell.dataset.tileId = tileId;
    const def = TILE_DEFINITIONS[tileId];
    cell.style.backgroundColor = getPaletteColor(def.type);
}

// --- DYNAMIC OBJECTS & PROPERTIES PANEL ---

function getObjectSize(type) {
    if (type === 'checkpoint') return 64;
    if (type === 'trophy') return 32;
    return 28; // All fruits
}

function placeObject(pixelX, pixelY, type) {
    const newObject = {
        id: nextObjectId++,
        type: type,
        x: pixelX / GRID_CONSTANTS.TILE_SIZE,
        y: pixelY / GRID_CONSTANTS.TILE_SIZE,
        size: getObjectSize(type)
    };
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
        el.style.width = `${obj.size}px`;
        el.style.height = `${obj.size}px`;
        el.style.left = `${obj.x * GRID_CONSTANTS.TILE_SIZE - (obj.size / 2)}px`;
        el.style.top = `${obj.y * GRID_CONSTANTS.TILE_SIZE - (obj.size / 2)}px`;
        el.title = obj.type;
        el.style.backgroundColor = getPaletteColor(obj.type);
        el.style.opacity = '0.8';

        el.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                selectObject(obj, e);
            }
        });
        gridContainer.appendChild(el);
    });
}

function selectObject(obj, event) {
    selectedObject = obj;
    propertiesPanel.innerHTML = `
        <h3 class="properties-title">${obj.type.replace(/_/g, ' ')} (ID: ${obj.id})</h3>
        <label for="prop-x">Grid X:</label>
        <input type="number" id="prop-x" step="0.1" value="${obj.x.toFixed(2)}">
        <label for="prop-y">Grid Y:</label>
        <input type="number" id="prop-y" step="0.1" value="${obj.y.toFixed(2)}">
    `;
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
        obj[prop] = value;
        renderDynamicObjects();
        const objEl = gridContainer.querySelector(`.dynamic-object[data-id='${id}']`);
        if (objEl) objEl.classList.add('selected');
    }
}

function deleteObject(id) {
    dynamicObjects = dynamicObjects.filter(obj => obj.id !== id);
    if (selectedObject && selectedObject.id === id) deselectObject();
    renderDynamicObjects();
}

// --- FILE I/O & CONVERSION ---

function handleFileLoad(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const levelData = JSON.parse(event.target.result);
            if (levelData.gridWidth) {
                loadGridLevel(levelData);
            } else if (levelData.platforms) {
                loadAndConvertOldLevel(levelData);
            } else {
                alert('Unrecognized level format.');
            }
        } catch (err) {
            alert('Error parsing JSON file: ' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = null;
}

function loadGridLevel(data) {
    gridWidth = data.gridWidth;
    gridHeight = data.gridHeight;
    levelNameInput.value = data.name;
    backgroundInput.value = data.background || 'backgroundTile';
    generateGrid();
    data.layout.forEach((rowString, y) => {
        [...rowString].forEach((tileId, x) => {
            const index = y * gridWidth + x;
            if (gridContainer.children[index]) {
                paintCell(gridContainer.children[index], tileId);
            }
        });
    });
    dynamicObjects = (data.objects || []).map((obj, i) => ({ ...obj, id: i, size: getObjectSize(obj.type) }));
    nextObjectId = dynamicObjects.length;
    renderDynamicObjects();
}

function loadAndConvertOldLevel(data) {
    const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
    gridWidth = Math.ceil(data.width / TILE_SIZE);
    gridHeight = Math.ceil(data.height / TILE_SIZE);
    levelNameInput.value = data.name + " (Converted)";
    backgroundInput.value = data.background || 'backgroundTile';
    generateGrid();
    const terrainToIdMap = {};
    for (const [id, def] of Object.entries(TILE_DEFINITIONS)) {
        terrainToIdMap[def.type] = id;
    }
    data.platforms.forEach(platform => {
        const startX = Math.floor(platform.x / TILE_SIZE);
        const startY = Math.floor(platform.y / TILE_SIZE);
        const endX = Math.floor((platform.x + platform.width) / TILE_SIZE);
        const endY = Math.floor((platform.y + platform.height) / TILE_SIZE);
        const tileId = terrainToIdMap[platform.terrainType] || '1';
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) continue;
                const index = y * gridWidth + x;
                paintCell(gridContainer.children[index], tileId);
            }
        }
    });
    dynamicObjects = [];
    nextObjectId = 0;
    (data.fruits || []).forEach(obj => placeObject(obj.x, obj.y, obj.fruitType));
    (data.checkpoints || []).forEach(obj => placeObject(obj.x, obj.y, 'checkpoint'));
    if (data.trophy) placeObject(data.trophy.x, data.trophy.y, 'trophy');
    
    renderDynamicObjects();
    alert(`Converted level "${data.name}". Review object placement and export.`);
}

function exportLevelJSON() {
    const layout = [];
    let rowString = '';
    for (let i = 0; i < gridContainer.children.length; i++) {
        rowString += gridContainer.children[i].dataset.tileId;
        if ((i + 1) % gridWidth === 0) {
            layout.push(rowString);
            rowString = '';
        }
    }
    const exportData = {
        name: levelNameInput.value,
        gridWidth: gridWidth,
        gridHeight: gridHeight,
        background: backgroundInput.value,
        startPosition: { x: 1.5, y: gridHeight - 2.5 },
        layout: layout,
        objects: dynamicObjects.map(({ id, size, ...rest }) => rest) // Exclude internal editor properties
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${levelNameInput.value.replace(/\s/g, '-')}.json`);
    dlAnchorElem.click();
    dlAnchorElem.remove();
}

// --- START THE EDITOR ---
init();