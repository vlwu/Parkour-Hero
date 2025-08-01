export const DOM = {

    gridContainer: null,
    gridParent: null,
    propertiesPanel: null,
    tilesetCanvas: null,
    specialTilesetCanvas: null,
    tilesetPaletteContainer: null,
    itemsPalette: null,
    trapsPalette: null,
    enemiesPalette: null,
    levelNameInput: null,
    backgroundInput: null,
    newBtn: null,
    resizeBtn: null,
    loadBtn: null,
    exportBtn: null,
    createLevelBtn: null,
    backBtn: null,
    testLevelBtn: null,
    undoBtn: null,
    redoBtn: null,
    zoomInBtn: null,
    zoomOutBtn: null,
    loadFileInput: null,

    // New Tool Palette
    toolsPalette: null,
    selectToolBtn: null,
    eraseToolBtn: null,

    // New Selection Actions
    selectionActions: null,
    copySelectionBtn: null,
    cutSelectionBtn: null,
    deleteSelectionBtn: null,

    resizeModalOverlay: null,
    newWidthInput: null,
    newHeightInput: null,
    anchorGrid: null,
    confirmResizeBtn: null,
    cancelResizeBtn: null,


    init() {
        this.gridContainer = document.getElementById('grid-container');
        this.gridParent = document.getElementById('grid-parent');
        this.propertiesPanel = document.getElementById('properties-panel');
        this.tilesetCanvas = document.getElementById('tileset-canvas');
        this.specialTilesetCanvas = document.getElementById('special-tileset-canvas');
        this.tilesetPaletteContainer = document.querySelector('.tileset-palette-container');
        this.itemsPalette = document.getElementById('items-palette');
        this.trapsPalette = document.getElementById('traps-palette');
        this.enemiesPalette = document.getElementById('enemies-palette');
        this.levelNameInput = document.getElementById('levelNameInput');
        this.backgroundInput = document.getElementById('backgroundInput');
        this.newBtn = document.getElementById('newBtn');
        this.resizeBtn = document.getElementById('resizeBtn');
        this.loadBtn = document.getElementById('loadBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.createLevelBtn = document.getElementById('createLevelBtn');
        this.backBtn = document.getElementById('backBtn');
        this.testLevelBtn = document.getElementById('testLevelBtn');
        this.undoBtn = document.getElementById('undoBtn');
        this.redoBtn = document.getElementById('redoBtn');
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.loadFileInput = document.getElementById('loadFile');

        this.toolsPalette = document.getElementById('tools-palette');
        this.selectToolBtn = document.getElementById('select-tool-btn');
        this.eraseToolBtn = document.getElementById('erase-tool-btn');
        this.selectionActions = document.getElementById('selection-actions');
        this.copySelectionBtn = document.getElementById('copySelectionBtn');
        this.cutSelectionBtn = document.getElementById('cutSelectionBtn');
        this.deleteSelectionBtn = document.getElementById('deleteSelectionBtn');

        this.resizeModalOverlay = document.getElementById('resize-modal-overlay');
        this.newWidthInput = document.getElementById('newWidthInput');
        this.newHeightInput = document.getElementById('newHeightInput');
        this.anchorGrid = document.getElementById('anchor-grid');
        this.confirmResizeBtn = document.getElementById('confirmResizeBtn');
        this.cancelResizeBtn = document.getElementById('cancelResizeBtn');
    }
};