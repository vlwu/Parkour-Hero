import { TILESET_CONFIG, TILESET_CONFIG_SPECIAL, SPECIAL_TILE_ID_OFFSET } from '../../entities/tile-definitions.js';
import { ENEMY_DEFINITIONS } from '../../entities/enemy-definitions.js';
import { OBJECT_DESCRIPTIONS, PALETTE_ABBREVIATIONS, getPaletteColor } from '../config/EditorSettings.js';
import { DOM } from './DOM.js';

export class Palette {
    constructor(onSelectionChange) {
        this.onSelectionChange = onSelectionChange;
        this.selectedPaletteItem = { type: 'tile', id: '1' };

        this.mainTileset = {
            canvas: DOM.tilesetCanvas,
            ctx: DOM.tilesetCanvas.getContext('2d'),
            image: new Image(),
            config: TILESET_CONFIG,
            idOffset: 0
        };

        this.specialTileset = {
            canvas: DOM.specialTilesetCanvas,
            ctx: DOM.specialTilesetCanvas.getContext('2d'),
            image: new Image(),
            config: TILESET_CONFIG_SPECIAL,
            idOffset: SPECIAL_TILE_ID_OFFSET
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
            'wood_third_h', 'wood_third_v', 'wood_ninth_sq', 'wood_four_ninths_sq',
            'stone_third_h', 'stone_third_v', 'stone_ninth_sq', 'stone_four_ninths_sq',
            'gold_third_h', 'gold_third_v', 'gold_ninth_sq', 'gold_four_ninths_sq',
            'orange_dirt_third_h', 'orange_dirt_third_v', 'orange_dirt_ninth_sq', 'orange_dirt_four_ninths_sq'
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

        tileset.canvas.addEventListener('click', (e) => {
            const rect = tileset.canvas.getBoundingClientRect();
            const scaleX = tileset.canvas.width / rect.width;
            const scaleY = tileset.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            const tileX = Math.floor(x / tileset.config.tileWidth);
            const tileY = Math.floor(y / tileset.config.tileHeight);

            let tileId = (tileY * tileset.config.columns + tileX) + tileset.idOffset;

            this.selectedPaletteItem = { type: 'tile', id: tileId.toString() };
            this.updateSelectionVisuals();
            this.onSelectionChange(this.selectedPaletteItem);
        });
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

    updateSelectionVisuals() {
        [this.mainTileset, this.specialTileset].forEach(tileset => {
            tileset.ctx.clearRect(0, 0, tileset.canvas.width, tileset.canvas.height);
            if (tileset.image.complete) {
                tileset.ctx.drawImage(tileset.image, 0, 0);
            }
        });

        if (this.selectedPaletteItem.type === 'tile') {
            const selectedId = parseInt(this.selectedPaletteItem.id, 10);
            const targetTileset = selectedId >= SPECIAL_TILE_ID_OFFSET ? this.specialTileset : this.mainTileset;
            
            const localId = selectedId - targetTileset.idOffset;
            const tileX = (localId % targetTileset.config.columns) * targetTileset.config.tileWidth;
            const tileY = Math.floor(localId / targetTileset.config.columns) * targetTileset.config.tileHeight;

            targetTileset.ctx.strokeStyle = '#3498db'; // --accent-color
            targetTileset.ctx.lineWidth = 2;
            targetTileset.ctx.strokeRect(tileX + 1, tileY + 1, targetTileset.config.tileWidth - 2, targetTileset.config.tileHeight - 2);
        }

        document.querySelectorAll('.palette-item').forEach(el => {
            const isSelected = el.dataset.type === this.selectedPaletteItem.type && el.dataset.id === this.selectedPaletteItem.id;
            el.classList.toggle('selected', isSelected);
        });
    }

    getSelection() {
        return this.selectedPaletteItem;
    }
}