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
            const { width, height } = this._getObjectDimensions(obj.type);
            const newObj = { ...obj, id: this.nextObjectId++, width, height };
            if (newObj.type === 'spiked_ball') {
                newObj.chainLength = obj.chainLength || 100;
                newObj.swingArc = obj.swingArc || 90;
                newObj.period = obj.period || 4;
            }
            if (newObj.type === 'arrow_bubble') {
                newObj.direction = obj.direction || 'right';
                newObj.knockbackSpeed = obj.knockbackSpeed || 300;
            }
            if (newObj.type === 'fan') {
                newObj.direction = obj.direction || 'right';
                newObj.pushStrength = obj.pushStrength || 250;
                newObj.windHeight = obj.windHeight || 120;
            }
            return newObj;
        });

        if (startPosition) {
            const { width, height } = this._getObjectDimensions('player_spawn');
            this.objects.push({
                id: this.nextObjectId++,
                type: 'player_spawn',
                x: startPosition.x,
                y: startPosition.y,
                width,
                height
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

        const { width, height } = this._getObjectDimensions(type);
        const newObject = {
            id: this.nextObjectId++,
            type: type,
            x: pixelX / GRID_CONSTANTS.TILE_SIZE,
            y: pixelY / GRID_CONSTANTS.TILE_SIZE,
            width, height
        };

        if (type === 'spiked_ball') {
            newObject.chainLength = 100;
            newObject.swingArc = 90;
            newObject.period = 4;
            newObject.tiltAmount = 0.5;
        }

        if (type === 'arrow_bubble') {
            newObject.direction = 'right'; // Default direction
            newObject.knockbackSpeed = 300;
        }
        
        if (type === 'fan') {
            newObject.direction = 'right';
            newObject.pushStrength = 250;
            newObject.windHeight = 120;
        }

        if (type === 'saw') {
            newObject.direction = 'horizontal';
            newObject.distance = 150;
            newObject.speed = 50;
        }

        this._applySnapping(newObject);
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
            .map(({ id, width, height, ...rest }) => {
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
            el.style.width = `${obj.width}px`;
            el.style.height = `${obj.height}px`;
            el.style.left = `${obj.x * GRID_CONSTANTS.TILE_SIZE - (obj.width / 2)}px`;
            el.style.top = `${obj.y * GRID_CONSTANTS.TILE_SIZE - (obj.height / 2)}px`;
            el.title = obj.type;
            el.style.backgroundColor = getPaletteColor(obj.type);
            el.style.opacity = '0.8';

            let angle = 0;
            if (obj.type === 'fan') {
                // Fan sprite rotation (base sprite faces UP)
                switch (obj.direction) {
                    case 'up': angle = 0; break;
                    case 'right': angle = 90; break;
                    case 'down': angle = 180; break;
                    case 'left': angle = -90; break;
                    default: angle = 90; break;
                }
            } else if (obj.type === 'arrow_bubble') {
                 // Arrow bubble sprite rotation (base sprite faces RIGHT)
                switch (obj.direction) {
                    case 'up': angle = -90; break;
                    case 'left': angle = 180; break;
                    case 'down': angle = 90; break;
                    case 'right': default: angle = 0; break;
                }
            }
            el.style.transform = `rotate(${angle}deg)`;

            if (obj.type === 'player_spawn') {
                el.innerHTML = '<span style="color: white; font-weight: bold; font-size: 18px;">P</span>';
                el.style.display = 'flex';
                el.style.justifyContent = 'center';
                el.style.alignItems = 'center';
            }
            DOM.gridContainer.appendChild(el);
        });
    }

    _applySnapping(obj) {
        const groundSnappable = ['trophy', 'checkpoint', 'trampoline', 'spike', 'fire_trap'];
        if (groundSnappable.includes(obj.type)) {
            this._snapToGround(obj);
        } else if (obj.type === 'fan') {
            this._snapFanToEdge(obj);
        }
    }

    _snapFanToEdge(fan) {
        const gridX = Math.floor(fan.x);
        const gridY = Math.floor(fan.y);
        
        let bestCandidate = { distSq: Infinity, x: fan.x, y: fan.y, dir: fan.direction };

        const checks = [
            { dx: 0, dy: -1, dir: 'down' },
            { dx: 0, dy: 1, dir: 'up' },
            { dx: -1, dy: 0, dir: 'right' },
            { dx: 1, dy: 0, dir: 'left' }
        ];
        
        for (const check of checks) {
            const tileX = gridX + check.dx;
            const tileY = gridY + check.dy;

            if (this.grid.isTileSolid(tileX, tileY)) {
                let snapX, snapY;
                const fanH_half_grid = (fan.height / 2) / GRID_CONSTANTS.TILE_SIZE;
                
                // The distance from the fan's center to the surface it attaches to should always be
                // half of its shortest dimension (its height of 8px), regardless of orientation.
                switch(check.dir) {
                    case 'up': // Fan sits on top of a platform.
                        snapX = tileX + 0.5;
                        snapY = tileY - fanH_half_grid;
                        break;
                    case 'down': // Fan hangs below a platform.
                        snapX = tileX + 0.5;
                        snapY = tileY + 1 + fanH_half_grid;
                        break;
                    case 'left': // Fan is on the right side of a platform.
                        snapX = tileX - fanH_half_grid;
                        snapY = tileY + 0.5;
                        break;
                    case 'right': // Fan is on the left side of a platform.
                        snapX = tileX + 1 + fanH_half_grid;
                        snapY = tileY + 0.5;
                        break;
                }

                const distSq = (snapX - fan.x)**2 + (snapY - fan.y)**2;

                if (distSq < bestCandidate.distSq) {
                    bestCandidate = { distSq, x: snapX, y: snapY, dir: check.dir };
                }
            }
        }
        
        if (bestCandidate.distSq < 4) {
            fan.x = bestCandidate.x;
            fan.y = bestCandidate.y;
            fan.direction = bestCandidate.dir;
        }
    }

    _snapToGround(obj) {
        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const objBottomY = obj.y + (obj.height / 2) / TILE_SIZE;
        const gridX = obj.x;

        for (let yOffset = 0; yOffset < 3; yOffset++) {
            const checkY = Math.floor(objBottomY) + yOffset;
            if (this.grid.isTileSolid(gridX, checkY)) {
                const platformTopY = checkY;
                const newCenterY = platformTopY - (obj.height / 2) / TILE_SIZE;
                
                if (Math.abs(newCenterY - obj.y) < 2) {
                    obj.y = newCenterY;
                    return;
                }
            }
        }
    }

    _getObjectDimensions(type) {
        switch(type) {
            case 'checkpoint': return { width: 64, height: 64 };
            case 'trophy': return { width: 64, height: 64 };
            case 'player_spawn': return { width: 32, height: 32 };
            case 'trampoline': return { width: 28, height: 28 };
            case 'spike': return { width: 16, height: 16 };
            case 'fire_trap': return { width: 16, height: 16 };
            case 'spiked_ball': return { width: 28, height: 28 };
            case 'arrow_bubble': return { width: 18, height: 18 };
            case 'fan': return { width: 24, height: 8 };
            case 'falling_platform': return { width: 32, height: 10 };
            case 'rock_head': return { width: 42, height: 42 };
            case 'spike_head': return { width: 54, height: 52 };
            case 'saw': return { width: 38, height: 38 };
            default: return { width: 28, height: 28 }; // Default for fruits
        }
    }
}