// src/editor/core/ObjectManager.js

import { GRID_CONSTANTS } from '../../utils/constants.js';
import { getPaletteColor } from '../config/EditorSettings.js';
import { DOM } from '../ui/DOM.js';

const round = (val) => Math.round(val * 100) / 100;

export class ObjectManager {
    constructor(grid) {
        this.grid = grid; // A reference to the Grid module to check for solid tiles
        this.objects = [];
        this.nextObjectId = 0;
    }

    clear() {
        this.objects = [];
        this.render();
    }

    load(objectsData, startPosition) {
        this.nextObjectId = 0;
        this.objects = (objectsData || []).map(obj => {
            const newObj = { ...obj, id: this.nextObjectId++, size: this._getObjectSize(obj.type) };
            if (newObj.type === 'spiked_ball') {
                newObj.chainLength = obj.chainLength || 100;
                newObj.swingArc = obj.swingArc || 90;
                newObj.period = obj.period || 4;
            }
            return newObj;
        });

        if (startPosition) {
            this.objects.push({
                id: this.nextObjectId++,
                type: 'player_spawn',
                x: startPosition.x,
                y: startPosition.y,
                size: this._getObjectSize('player_spawn')
            });
        }
        this.render();
    }

    addObject(type, pixelX, pixelY) {
        // Handle player spawn uniqueness
        let replacedSpawn = null;
        if (type === 'player_spawn') {
            const existingIndex = this.objects.findIndex(o => o.type === 'player_spawn');
            if (existingIndex > -1) {
                replacedSpawn = this.objects.splice(existingIndex, 1)[0];
            }
        }

        const newObject = {
            id: this.nextObjectId++,
            type: type,
            x: pixelX / GRID_CONSTANTS.TILE_SIZE,
            y: pixelY / GRID_CONSTANTS.TILE_SIZE,
            size: this._getObjectSize(type)
        };

        if (type === 'spiked_ball') {
            newObject.chainLength = 100;
            newObject.swingArc = 90;
            newObject.period = 4;
            newObject.tiltAmount = 0.5;
        }

        this._snapObjectToGround(newObject);
        newObject.x = round(newObject.x);
        newObject.y = round(newObject.y);

        this.objects.push(newObject);
        this.render();
        return { newObject, replacedSpawn };
    }

    deleteObject(id) {
        const index = this.objects.findIndex(o => o.id === id);
        if (index === -1) return null;

        const deletedObject = this.objects.splice(index, 1)[0];
        this.render();
        return deletedObject;
    }

    updateObjectProp(id, prop, value) {
        const obj = this.getObject(id);
        if (obj) {
            obj[prop] = value;
            this.render();
        }
    }
    
    getObject(id) {
        return this.objects.find(o => o.id === id);
    }
    
    getAllObjects() {
        return this.objects;
    }

    getObjectsForExport() {
        const playerSpawn = this.objects.find(obj => obj.type === 'player_spawn');
        const startPos = playerSpawn
            ? { x: round(playerSpawn.x), y: round(playerSpawn.y) }
            : { x: 1.5, y: this.grid.height - 2.5 };

        const finalObjects = this.objects
            .filter(obj => obj.type !== 'player_spawn')
            .map(({ id, size, ...rest }) => {
                const finalObj = {};
                for (const key in rest) {
                    finalObj[key] = typeof rest[key] === 'number' ? round(rest[key]) : rest[key];
                }
                return finalObj;
            });

        return { startPos, finalObjects };
    }

    render() {
        DOM.gridContainer.querySelectorAll('.dynamic-object').forEach(el => el.remove());
        this.objects.forEach(obj => {
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

            if (obj.type === 'player_spawn') {
                el.innerHTML = '<span style="color: white; font-weight: bold; font-size: 18px;">P</span>';
                el.style.display = 'flex';
                el.style.justifyContent = 'center';
                el.style.alignItems = 'center';
            }
            DOM.gridContainer.appendChild(el);
        });
    }

    _snapObjectToGround(obj) {
        const snappableTypes = ['trophy', 'checkpoint', 'trampoline', 'spike', 'fire_trap'];
        if (!snappableTypes.includes(obj.type)) return;

        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const objBottomY = obj.y + (obj.size / 2) / TILE_SIZE;
        const gridX = obj.x;

        for (let yOffset = 0; yOffset < 3; yOffset++) {
            const checkY = Math.floor(objBottomY) + yOffset;
            if (this.grid.isTileSolid(gridX, checkY)) {
                const platformTopY = checkY;
                const newCenterY = platformTopY - (obj.size / 2) / TILE_SIZE;
                
                // Check if the snap distance is reasonable
                if (Math.abs(newCenterY - obj.y) < 2) {
                    obj.y = newCenterY;
                    return;
                }
            }
        }
    }

    _getObjectSize(type) {
        if (type === 'checkpoint') return 64;
        if (type === 'trophy') return 32;
        if (type === 'player_spawn') return 32;
        if (type === 'trampoline') return 28;
        if (type === 'spike' || type === 'fire_trap') return 16;
        if (type === 'spiked_ball') return 28;
        return 28; // Default for fruits
    }
}