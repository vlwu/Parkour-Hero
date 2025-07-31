import { TILESET_CONFIG, getTileProperties } from '../../entities/tile-definitions.js';
import { ENEMY_DEFINITIONS } from '../../entities/enemy-definitions.js';
import { OBJECT_DESCRIPTIONS, PALETTE_ABBREVIATIONS, getPaletteColor } from '../config/EditorSettings.js';
import { DOM } from './DOM.js';

export class Palette {
    constructor(onSelectionChange) {
        this.onSelectionChange = onSelectionChange;
        this.selectedPaletteItem = { type: 'tile', id: '1' }; // Default selection is tile with ID '1'

        this.canvas = DOM.tilesetCanvas;
        this.ctx = this.canvas.getContext('2d');
        this.tilesetImage = new Image();
    }

    populate() {
        this.tilesetImage.onload = () => {
            this.canvas.width = this.tilesetImage.width;
            this.canvas.height = this.tilesetImage.height;
            this.ctx.imageSmoothingEnabled = false;
            this.updateSelectionVisuals();
        };
        this.tilesetImage.src = TILESET_CONFIG.image;

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            const tileX = Math.floor(x / TILESET_CONFIG.tileWidth);
            const tileY = Math.floor(y / TILESET_CONFIG.tileHeight);

            const tileId = (tileY * TILESET_CONFIG.columns + tileX).toString();

            this.selectedPaletteItem = { type: 'tile', id: tileId };
            this.updateSelectionVisuals();
            this.onSelectionChange(this.selectedPaletteItem);
        });

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
        // Redraw the base tileset image
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.tilesetImage.complete) {
            this.ctx.drawImage(this.tilesetImage, 0, 0);
        }

        // Highlight selected tile on the canvas
        if (this.selectedPaletteItem.type === 'tile') {
            const id = parseInt(this.selectedPaletteItem.id, 10);
            const tileX = (id % TILESET_CONFIG.columns) * TILESET_CONFIG.tileWidth;
            const tileY = Math.floor(id / TILESET_CONFIG.columns) * TILESET_CONFIG.tileHeight;

            this.ctx.strokeStyle = '#3498db'; // --accent-color
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(tileX + 1, tileY + 1, TILESET_CONFIG.tileWidth - 2, TILESET_CONFIG.tileHeight - 2);
        }

        // Toggle 'selected' class on other palette items
        document.querySelectorAll('.palette-item').forEach(el => {
            const isSelected = el.dataset.type === this.selectedPaletteItem.type && el.dataset.id === this.selectedPaletteItem.id;
            el.classList.toggle('selected', isSelected);
        });
    }

    getSelection() {
        return this.selectedPaletteItem;
    }
}