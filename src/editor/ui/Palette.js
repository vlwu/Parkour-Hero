import { TILESET_CONFIG, TILESET_CONFIG_SPECIAL, SPECIAL_TILE_ID_OFFSET } from '../../entities/tile-definitions.js';
import { ENEMY_DEFINITIONS } from '../../entities/enemy-definitions.js';
import { OBJECT_DESCRIPTIONS, PALETTE_ABBREVIATIONS, getPaletteColor } from '../config/EditorSettings.js';
import { DOM } from './DOM.js';

export class Palette {
    constructor(onSelectionChange) {
        this.onSelectionChange = onSelectionChange;
        this.selectedPaletteItem = {
            type: 'tile',
            selection: { x: 0, y: 0, width: 1, height: 1, ids: ['1'], idOffset: 1 }
        };

        this.isSelectingInPalette = false;
        this.selectionStartCoords = null;
        this.currentTilesetSelection = null;
        this.activeTilesetForSelection = null;

        this._boundPaletteMouseMove = this._onPaletteMouseMove.bind(this);
        this._boundPaletteMouseUp = this._onPaletteMouseUp.bind(this);

        this.mainTileset = {
            canvas: DOM.tilesetCanvas,
            ctx: DOM.tilesetCanvas.getContext('2d'),
            image: new Image(),
            config: TILESET_CONFIG,
            idOffset: 1
        };

        this.specialTileset = {
            canvas: DOM.specialTilesetCanvas,
            ctx: DOM.specialTilesetCanvas.getContext('2d'),
            image: new Image(),
            config: TILESET_CONFIG_SPECIAL,
            idOffset: SPECIAL_TILE_ID_OFFSET + 1
        };
    }

    populate() {
        this._initializeTileset(this.mainTileset);
        this._initializeTileset(this.specialTileset);

        const itemTypes = ['player_spawn', 'fruit_apple', 'fruit_bananas', 'fruit_cherries', 'fruit_kiwi', 'fruit_melon', 'fruit_orange', 'fruit_pineapple', 'fruit_strawberry', 'checkpoint', 'trophy'];
        itemTypes.forEach(type => {
            const abbreviation = PALETTE_ABBREVIATIONS[type] || '???';
            const item = this._createPaletteItem('object', type, type.replace(/_/g, ' '), abbreviation);
            item.style.backgroundColor = getPaletteColor(type);
            DOM.itemsPalette.appendChild(item);
        });

        const trapTypes = [
            'spike', 'fire_trap', 'trampoline', 'spiked_ball', 'arrow_bubble', 'fan', 'falling_platform', 'rock_head', 'spike_head', 'saw',
        ];
        trapTypes.forEach(type => {
            const abbreviation = PALETTE_ABBREVIATIONS[type] || '???';
            const item = this._createPaletteItem('object', type, type.replace(/_/g, ' '), abbreviation);
            item.style.backgroundColor = getPaletteColor(type);
            DOM.trapsPalette.appendChild(item);
        });

        for (const type of Object.keys(ENEMY_DEFINITIONS)) {
            const abbreviation = PALETTE_ABBREVIATIONS[type] || '???';
            const item = this._createPaletteItem('enemy', type, type, abbreviation);
            item.style.backgroundColor = getPaletteColor(type);
            DOM.enemiesPalette.appendChild(item);
        }

        DOM.selectToolBtn.addEventListener('click', () => this.selectTool('select'));
        DOM.eraseToolBtn.addEventListener('click', () => this.selectTool('eraser'));


        this.updateSelectionVisuals();
    }

    _initializeTileset(tileset) {
        tileset.image.onload = () => {
            tileset.canvas.width = tileset.image.width;
            tileset.canvas.height = tileset.image.height;
            tileset.ctx.imageSmoothingEnabled = false;
            this.updateSelectionVisuals();
        };
        tileset.image.src = tileset.config.image;

        tileset.canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;

            this.isSelectingInPalette = true;
            this.activeTilesetForSelection = tileset;
            
            const { tileX, tileY } = this._getCoordsFromEvent(e, tileset);
            this.selectionStartCoords = { tileX, tileY };
            
            this.currentTilesetSelection = {
                tileX: tileX,
                tileY: tileY,
                width: 1,
                height: 1,
            };
            this.updateSelectionVisuals();
            
            document.addEventListener('mousemove', this._boundPaletteMouseMove);
            document.addEventListener('mouseup', this._boundPaletteMouseUp);
        });
    }

    _getCoordsFromEvent(e, tileset) {
        const rect = tileset.canvas.getBoundingClientRect();
        const scaleX = tileset.canvas.width / rect.width;
        const scaleY = tileset.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const tileX = Math.floor(x / tileset.config.tileWidth);
        const tileY = Math.floor(y / tileset.config.tileHeight);
        return { tileX, tileY };
    }
    
    _onPaletteMouseMove(e) {
        if (!this.isSelectingInPalette) return;

        const currentTileset = this.activeTilesetForSelection;
        const { tileX, tileY } = this._getCoordsFromEvent(e, currentTileset);
        const start = this.selectionStartCoords;

        const x1 = Math.min(start.tileX, tileX);
        const y1 = Math.min(start.tileY, tileY);
        const x2 = Math.max(start.tileX, tileX);
        const y2 = Math.max(start.tileY, tileY);

        this.currentTilesetSelection = {
            tileX: x1,
            tileY: y1,
            width: x2 - x1 + 1,
            height: y2 - y1 + 1,
        };
        this.updateSelectionVisuals();
    }

    _onPaletteMouseUp() {
        if (!this.isSelectingInPalette) return;

        if (this.currentTilesetSelection) {
            const sel = this.currentTilesetSelection;
            const selectedTileset = this.activeTilesetForSelection;
            const ids = [];

            for (let y = 0; y < sel.height; y++) {
                for (let x = 0; x < sel.width; x++) {
                    const currentTileX = sel.tileX + x;
                    const currentTileY = sel.tileY + y;
                    if (currentTileX < selectedTileset.config.columns && currentTileY < (selectedTileset.image.height / selectedTileset.config.tileHeight)) {
                        const tileId = (currentTileY * selectedTileset.config.columns + currentTileX) + selectedTileset.idOffset;
                        ids.push(tileId.toString());
                    } else {
                        ids.push('0');
                    }
                }
            }
            
            this.selectedPaletteItem = {
                type: 'tile',
                selection: {
                    x: sel.tileX,
                    y: sel.tileY,
                    width: sel.width,
                    height: sel.height,
                    ids: ids,
                    idOffset: selectedTileset.idOffset
                }
            };
            this.onSelectionChange(this.selectedPaletteItem);
        }

        this.isSelectingInPalette = false;
        this.selectionStartCoords = null;
        this.currentTilesetSelection = null;
        this.activeTilesetForSelection = null;

        this.updateSelectionVisuals();
        
        document.removeEventListener('mousemove', this._boundPaletteMouseMove);
        document.removeEventListener('mouseup', this._boundPaletteMouseUp);
    }

    _createPaletteItem(type, id, title, abbreviation) {
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
            this.selectedPaletteItem = { type, id };
            this.updateSelectionVisuals();
            this.onSelectionChange(this.selectedPaletteItem);
        });
        return item;
    }

    selectTool(toolName) {
        this.selectedPaletteItem = { type: 'tool', id: toolName };
        this.currentTilesetSelection = null;
        this.updateSelectionVisuals();
        this.onSelectionChange(this.selectedPaletteItem);
    }

    updateSelectionVisuals() {
        [this.mainTileset, this.specialTileset].forEach(tileset => {
            tileset.ctx.clearRect(0, 0, tileset.canvas.width, tileset.canvas.height);
            if (tileset.image.complete) {
                tileset.ctx.drawImage(tileset.image, 0, 0);
            }
        });

        const selectionToDraw = this.isSelectingInPalette 
            ? this.currentTilesetSelection 
            : (this.selectedPaletteItem.type === 'tile' ? this.selectedPaletteItem.selection : null);

        if (selectionToDraw) {
            const sel = selectionToDraw;
            const targetTileset = (this.isSelectingInPalette && this.activeTilesetForSelection)
                ? this.activeTilesetForSelection
                : (sel.idOffset > 1 ? this.specialTileset : this.mainTileset);
            
            const tileX = (sel.x ?? sel.tileX) * targetTileset.config.tileWidth;
            const tileY = (sel.y ?? sel.tileY) * targetTileset.config.tileHeight;
            const selWidth = sel.width * targetTileset.config.tileWidth;
            const selHeight = sel.height * targetTileset.config.tileHeight;

            targetTileset.ctx.strokeStyle = '#3498db';
            targetTileset.ctx.lineWidth = 4;
            targetTileset.ctx.strokeRect(tileX + 2, tileY + 2, selWidth - 4, selHeight - 4);
        }

        document.querySelectorAll('.palette-item').forEach(el => {
            const isSelected = el.dataset.type === this.selectedPaletteItem.type && el.dataset.id === this.selectedPaletteItem.id;
            el.classList.toggle('selected', isSelected);
        });


        document.querySelectorAll('.tool-button').forEach(el => el.classList.remove('selected'));
        if (this.selectedPaletteItem.type === 'tool') {
            const btn = document.getElementById(`${this.selectedPaletteItem.id}-tool-btn`);
            if (btn) btn.classList.add('selected');
        }
    }

    getSelection() {
        return this.selectedPaletteItem;
    }
}