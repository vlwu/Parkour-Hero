export const DOM = {
    // Initialize properties as null
    gridContainer: null,
    gridParent: null,
    propertiesPanel: null,
    terrainPalette: null,
    itemsPalette: null,
    trapsPalette: null,
    enemiesPalette: null,
    levelNameInput: null,
    backgroundInput: null,
    newBtn: null,
    resizeBtn: null,
    loadBtn: null,
    exportBtn: null,
    testLevelBtn: null,
    undoBtn: null,
    redoBtn: null,
    zoomInBtn: null,
    zoomOutBtn: null,
    loadFileInput: null,

    // init method to populate the properties
    init() {
        this.gridContainer = document.getElementById('grid-container');
        this.gridParent = document.getElementById('grid-parent');
        this.propertiesPanel = document.getElementById('properties-panel');
        this.terrainPalette = document.getElementById('terrain-palette');
        this.itemsPalette = document.getElementById('items-palette');
        this.trapsPalette = document.getElementById('traps-palette');
        this.enemiesPalette = document.getElementById('enemies-palette');
        this.levelNameInput = document.getElementById('levelNameInput');
        this.backgroundInput = document.getElementById('backgroundInput');
        this.newBtn = document.getElementById('newBtn');
        this.resizeBtn = document.getElementById('resizeBtn');
        this.loadBtn = document.getElementById('loadBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.testLevelBtn = document.getElementById('testLevelBtn');
        this.undoBtn = document.getElementById('undoBtn');
        this.redoBtn = document.getElementById('redoBtn');
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.loadFileInput = document.getElementById('loadFile');
    }
};