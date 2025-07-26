import { TILE_DEFINITIONS } from '../../entities/tile-definitions.js';
import { ENEMY_DEFINITIONS } from '../../entities/enemy-definitions.js';
import { OBJECT_DESCRIPTIONS, PALETTE_ABBREVIATIONS, getPaletteColor } from '../config/EditorSettings.js';
import { DOM } from './DOM.js';

export class Palette {
    constructor(onSelectionChange) {
        this.onSelectionChange = onSelectionChange;
        this.selectedPaletteItem = { type: 'tile', id: '1' };
    }

    populate() {
        // Terrain
        for (const [id, def] of Object.entries(TILE_DEFINITIONS)) {
            const abbreviation = PALETTE_ABBREVIATIONS[def.type] || '???';
            const item = this._createPaletteItem('tile', id, def.type, abbreviation);
            item.style.backgroundColor = getPaletteColor(def.type);
            DOM.terrainPalette.appendChild(item);
        }

        // Items
        const itemTypes = ['player_spawn', 'fruit_apple', 'fruit_bananas', 'fruit_cherries', 'fruit_kiwi', 'fruit_melon', 'fruit_orange', 'fruit_pineapple', 'fruit_strawberry', 'checkpoint', 'trophy'];
        itemTypes.forEach(type => {
            const abbreviation = PALETTE_ABBREVIATIONS[type] || '???';
            const item = this._createPaletteItem('object', type, type.replace(/_/g, ' '), abbreviation);
            item.style.backgroundColor = getPaletteColor(type);
            DOM.itemsPalette.appendChild(item);
        });

        // Traps / General Purpose
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
        
        // Enemies
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
        document.querySelectorAll('.palette-item').forEach(el => {
            const isSelected = el.dataset.type === this.selectedPaletteItem.type && el.dataset.id === this.selectedPaletteItem.id;
            el.classList.toggle('selected', isSelected);
        });
    }

    // A method to get the current selection, useful for the main controller
    getSelection() {
        return this.selectedPaletteItem;
    }
}