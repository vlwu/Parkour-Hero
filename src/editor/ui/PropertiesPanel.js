import { TILE_DEFINITIONS } from '../../entities/tile-definitions.js';
import { OBJECT_DESCRIPTIONS } from '../config/EditorSettings.js';
import { DOM } from './DOM.js';

export class PropertiesPanel {
    constructor(onPropertyUpdate) {
        // Callback to notify the main controller of a property change
        this.onPropertyUpdate = onPropertyUpdate;
    }

    showItemDescription(itemType, itemId) {
        let title = '', description = '';
        if (itemType === 'tile') {
            const def = TILE_DEFINITIONS[itemId];
            title = def.type.replace(/_/g, ' ');
            description = def.description;
        } else {
            title = itemId.replace(/_/g, ' ');
            description = OBJECT_DESCRIPTIONS[itemId];
        }
        DOM.propertiesPanel.innerHTML = `<h3 class="properties-title">${title}</h3><p class="properties-description">${description || 'No description available.'}</p>`;
    }

    displayObject(obj) {
        let propertiesHTML = `<h3 class="properties-title">${obj.type.replace(/_/g, ' ')} (ID: ${obj.id})</h3>`;
        
        propertiesHTML += this._createNumberInput('x', 'Grid X (Anchor)', obj.x.toFixed(2), 0.01);
        propertiesHTML += this._createNumberInput('y', 'Grid Y (Anchor)', obj.y.toFixed(2), 0.01);

        if (obj.type === 'spiked_ball') {
            propertiesHTML += this._createNumberInput('chainLength', 'Chain Length (pixels)', obj.chainLength || 100, 1);
            propertiesHTML += this._createNumberInput('swingArc', 'Swing Arc (degrees)', obj.swingArc || 90, 1);
            propertiesHTML += this._createNumberInput('period', 'Period (seconds)', obj.period || 4, 0.1);
            propertiesHTML += this._createNumberInput('tiltAmount', 'Tilt Amount', obj.tiltAmount || 0.5, 0.1);
        }

        if (obj.type === 'arrow_bubble' || obj.type === 'fan') {
            const directions = ['right', 'left', 'up', 'down'];
            propertiesHTML += this._createSelectInput('direction', 'Direction', directions, obj.direction);
        }
        
        if (obj.type === 'arrow_bubble') {
            propertiesHTML += this._createNumberInput('knockbackSpeed', 'Knockback Speed', obj.knockbackSpeed || 450, 5);
        }

        if (obj.type === 'fan') {
            propertiesHTML += this._createNumberInput('pushStrength', 'Push Strength', obj.pushStrength || 250, 5);
            propertiesHTML += this._createNumberInput('windHeight', 'Wind Height (pixels)', obj.windHeight || 120, 5);
        }
        
        if (obj.type === 'saw') {
            const directions = ['horizontal', 'vertical'];
            propertiesHTML += this._createSelectInput('direction', 'Direction', directions, obj.direction);
            propertiesHTML += this._createNumberInput('distance', 'Path Distance (pixels)', obj.distance || 150, 5);
            propertiesHTML += this._createNumberInput('speed', 'Speed (px/sec)', obj.speed || 50, 5);
        }
        
        DOM.propertiesPanel.innerHTML = propertiesHTML;
        this._attachEventListeners(obj);
    }

    clear() {
        DOM.propertiesPanel.innerHTML = `<p>Select an object or palette item for info.</p>`;
    }

    _createNumberInput(id, label, value, step) {
        return `
            <label for="prop-${id}">${label}:</label>
            <input type="number" id="prop-${id}" step="${step}" value="${value}">
        `;
    }

    _createSelectInput(id, label, options, selectedValue) {
        let optionsHTML = options.map(opt => 
            `<option value="${opt}" ${opt === selectedValue ? 'selected' : ''}>${opt}</option>`
        ).join('');

        return `
            <label for="prop-${id}">${label}:</label>
            <select id="prop-${id}">${optionsHTML}</select>
        `;
    }

    _attachEventListeners(obj) {
        const attach = (prop, inputType = 'number') => {
            const element = document.getElementById(`prop-${prop}`);
            if (element) {
                if (inputType === 'number') {
                    element.addEventListener('input', (e) => this._handleInput(obj.id, prop, e.target));
                }
                element.addEventListener('change', (e) => this._handleChange(obj.id, prop, e.target));
            }
        };

        attach('x');
        attach('y');
        if (obj.type === 'spiked_ball') {
            attach('chainLength');
            attach('swingArc');
            attach('period');
            attach('tiltAmount');
        }
        if (obj.type === 'arrow_bubble' || obj.type === 'fan') {
            attach('direction', 'select');
        }

        if (obj.type === 'arrow_bubble') {
            attach('knockbackSpeed');
        }
        
        if (obj.type === 'fan') {
            attach('pushStrength');
            attach('windHeight');
        }

        if (obj.type === 'saw') {
            attach('direction', 'select');
            attach('distance');
            attach('speed');
        }
    }

    _handleInput(id, prop, element) {
        // This is for live visual feedback while dragging the number
        const value = parseFloat(element.value);
        if (!isNaN(value)) {
            // A "soft" update without creating a history entry yet
            this.onPropertyUpdate(id, prop, value, 'live');
        }
    }

    _handleChange(id, prop, element) {
        // This is for the final value, which creates a history entry
        let value;
        if (element.type === 'number') {
            value = parseFloat(element.value);
            if(isNaN(value)) return;
        } else { // Handles select, text, etc.
            value = element.value;
        }
        this.onPropertyUpdate(id, prop, value, 'final');
    }
}