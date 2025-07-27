import { GRID_CONSTANTS } from '../../utils/constants.js';
import { getPaletteColor } from '../config/EditorSettings.js';
import { ENEMY_DEFINITIONS } from '../../entities/enemy-definitions.js';
import { DOM } from '../ui/DOM.js';

const round = (val) => Math.round(val * 100) / 100;

const fractionalPlatformTypes = [
    'wood_third_h', 'wood_third_v', 'wood_ninth_sq', 'wood_four_ninths_sq',
    'stone_third_h', 'stone_third_v', 'stone_ninth_sq', 'stone_four_ninths_sq',
    'gold_third_h', 'gold_third_v', 'gold_ninth_sq', 'gold_four_ninths_sq',
    'orange_dirt_third_h', 'orange_dirt_third_v', 'orange_dirt_ninth_sq', 'orange_dirt_four_ninths_sq'
];

export class ObjectManager {
    constructor(grid) {
        this.grid = grid;
        this.objects = [];
        this.nextObjectId = 0;
    }

    clear() {
        this.objects = [];
        this.render();
    }

    load(objectsData, enemiesData, startPosition) {
        this.nextObjectId = 0;
        this.objects = [];

        (objectsData || []).forEach(obj => {
            const { width, height } = this._getObjectDimensions(obj.type);
            this.objects.push({ ...obj, id: this.nextObjectId++, width, height });
        });

        (enemiesData || []).forEach(enemy => {
             const { width, height } = this._getObjectDimensions(enemy.type);
             this.objects.push({ ...enemy, id: this.nextObjectId++, width, height });
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
            newObject.chainLength = 100; newObject.swingArc = 90; newObject.period = 4; newObject.tiltAmount = 0.5;
        }
        if (type === 'arrow_bubble') {
            newObject.direction = 'right'; newObject.knockbackSpeed = 300;
        }
        if (type === 'fan') {
            newObject.direction = 'right'; newObject.pushStrength = 250; newObject.windHeight = 120;
        }
        if (type === 'saw') {
            newObject.direction = 'horizontal'; newObject.distance = 150; newObject.speed = 50;
        }
        if (type === 'bluebird') {
            newObject.patrolDistance = 200;
            newObject.horizontalSpeed = 60;
            newObject.verticalAmplitude = 10;
        }

        this._applySnapping(newObject);
        this._updateGroundedEnemyBehavior(newObject);

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
        if (obj) { obj[prop] = value; this.render(); }
    }

    getObject(id) {
        return this.objects.find(o => o.id === id);
    }

    getAllObjects() {
        return this.objects;
    }

    getObjectsForExport() {
        const playerSpawn = this.objects.find(obj => obj.type === 'player_spawn');
        const startPos = playerSpawn ? { x: round(playerSpawn.x), y: round(playerSpawn.y) } : { x: 1.5, y: this.grid.height - 2.5 };
        const finalObjects = [];
        const finalEnemies = [];
        this.objects.forEach(obj => {
            if (obj.type === 'player_spawn') return;

            const { id, width, height, ...rest } = obj;
            const finalObj = {};
            for (const key in rest) { finalObj[key] = typeof rest[key] === 'number' ? round(rest[key]) : rest[key]; }

            if (ENEMY_DEFINITIONS[obj.type]) {
                finalEnemies.push(finalObj);
            } else {
                finalObjects.push(finalObj);
            }
        });
        return { startPos, finalObjects, finalEnemies };
    }

    render() {
        DOM.gridContainer.querySelectorAll('.dynamic-object, .chain-link-visual, .trap-path-visual').forEach(el => el.remove());
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
                switch (obj.direction) {
                    case 'up': angle = 0; break; case 'right': angle = 90; break;
                    case 'down': angle = 180; break; case 'left': angle = -90; break;
                    default: angle = 90; break;
                }
            } else if (obj.type === 'arrow_bubble') {
                switch (obj.direction) {
                    case 'up': angle = -90; break; case 'left': angle = 180; break;
                    case 'down': angle = 90; break; case 'right': default: angle = 0; break;
                }
            }
            el.style.transform = `rotate(${angle}deg)`;
            if (obj.type === 'player_spawn') {
                el.innerHTML = '<span style="color: white; font-weight: bold; font-size: 18px;">P</span>';
                el.style.display = 'flex'; el.style.justifyContent = 'center'; el.style.alignItems = 'center';
            }
            DOM.gridContainer.appendChild(el);

            if (obj.type === 'fire_trap' && obj.chainLength > 1) {
                const startX = obj.x * GRID_CONSTANTS.TILE_SIZE - (obj.width / 2);
                const startY = obj.y * GRID_CONSTANTS.TILE_SIZE - (obj.height / 2);

                for (let i = 1; i < obj.chainLength; i++) {
                    const visualEl = document.createElement('div');
                    visualEl.className = 'chain-link-visual';
                    visualEl.style.position = 'absolute';
                    visualEl.style.pointerEvents = 'none';
                    visualEl.style.width = `${obj.width}px`;
                    visualEl.style.height = `${obj.height}px`;
                    visualEl.style.left = `${startX + i * obj.width}px`;
                    visualEl.style.top = `${startY}px`;
                    visualEl.style.backgroundColor = getPaletteColor(obj.type);
                    visualEl.style.opacity = '0.7';
                    visualEl.style.boxSizing = 'border-box';
                    visualEl.style.border = '1px dashed rgba(255, 255, 255, 0.4)';
                    DOM.gridContainer.appendChild(visualEl);
                }
            }

            if (obj.type === 'saw') {
                const line = document.createElement('div');
                line.className = 'trap-path-visual';
                line.style.position = 'absolute';
                line.style.backgroundColor = 'rgba(0,0,0,0.7)';
                line.style.pointerEvents = 'none';
                line.style.zIndex = '-1';

                const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
                const distance = obj.distance || 150;

                if (obj.direction === 'horizontal') {
                    line.style.left = `${obj.x * TILE_SIZE - distance / 2}px`;
                    line.style.top = `${obj.y * TILE_SIZE - 1}px`;
                    line.style.width = `${distance}px`;
                    line.style.height = `2px`;
                } else {
                    line.style.left = `${obj.x * TILE_SIZE - 1}px`;
                    line.style.top = `${obj.y * TILE_SIZE - distance / 2}px`;
                    line.style.width = `2px`;
                    line.style.height = `${distance}px`;
                }
                DOM.gridContainer.appendChild(line);
            }

            if (obj.type === 'spiked_ball') {
                const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
                const chainLength = obj.chainLength || 100;
                const swingArc = obj.swingArc || 90;
                const maxAngleRad = (swingArc / 2) * (Math.PI / 180);

                const createLine = (angleRad, color, width) => {
                    const line = document.createElement('div');
                    line.className = 'trap-path-visual';
                    line.style.position = 'absolute';
                    line.style.backgroundColor = color;
                    line.style.width = `${width}px`;
                    line.style.height = `${chainLength}px`;
                    line.style.left = `${obj.x * TILE_SIZE}px`;
                    line.style.top = `${obj.y * TILE_SIZE}px`;
                    line.style.transformOrigin = 'top center';
                    line.style.transform = `rotate(${angleRad}rad)`;
                    line.style.pointerEvents = 'none';
                    line.style.zIndex = '-1';
                    return line;
                };

                DOM.gridContainer.appendChild(createLine(0, 'rgba(0,0,0,0.7)', 2));
                DOM.gridContainer.appendChild(createLine(-maxAngleRad, 'rgba(255,0,0,0.4)', 1));
                DOM.gridContainer.appendChild(createLine(maxAngleRad, 'rgba(255,0,0,0.4)', 1));
            }

            if (obj.type === 'bluebird') {
                const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
                const patrolDistance = obj.patrolDistance || ENEMY_DEFINITIONS.bluebird.ai.patrolDistance;
                const verticalAmplitude = obj.verticalAmplitude || ENEMY_DEFINITIONS.bluebird.ai.verticalAmplitude;


                const box = document.createElement('div');
                box.className = 'trap-path-visual';
                box.style.position = 'absolute';
                box.style.pointerEvents = 'none';
                box.style.zIndex = '-1';
                box.style.left = `${obj.x * TILE_SIZE - patrolDistance / 2}px`;
                box.style.top = `${obj.y * TILE_SIZE - verticalAmplitude}px`;
                box.style.width = `${patrolDistance}px`;
                box.style.height = `${verticalAmplitude * 2}px`;
                box.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                box.style.border = '1px dashed rgba(255, 255, 255, 0.4)';
                box.style.boxSizing = 'border-box';
                DOM.gridContainer.appendChild(box);


                const centerLine = document.createElement('div');
                centerLine.className = 'trap-path-visual';
                centerLine.style.position = 'absolute';
                centerLine.style.pointerEvents = 'none';
                centerLine.style.zIndex = '-1';
                centerLine.style.left = `${obj.x * TILE_SIZE - patrolDistance / 2}px`;
                centerLine.style.top = `${obj.y * TILE_SIZE - 1}px`;
                centerLine.style.width = `${patrolDistance}px`;
                centerLine.style.height = `2px`;
                centerLine.style.backgroundColor = 'rgba(0,0,0,0.5)';
                DOM.gridContainer.appendChild(centerLine);
            }
        });
    }

    _applySnapping(obj) {
        const groundEnemies = Object.keys(ENEMY_DEFINITIONS).filter(key => key !== 'bluebird' && key !== 'fatbird');
        const groundSnappable = ['trophy', 'checkpoint', 'trampoline', 'spike', 'fire_trap', ...groundEnemies];

        if (fractionalPlatformTypes.includes(obj.type)) {
            this._snapFractionalPlatform(obj);
        } else if (groundSnappable.includes(obj.type)) {
            this._snapToGround(obj);
        } else if (obj.type === 'fan') {
            this._snapFanToEdge(obj);
        }
    }

    _snapFractionalPlatform(obj) {
        const gridX = Math.floor(obj.x);
        const gridY = Math.floor(obj.y);

        let snapX, snapY;

        const findClosest = (value, options) => {
            return options.reduce((prev, curr) => (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev));
        };

        if (obj.type.endsWith('_third_h')) {
            snapX = gridX + 0.5;
            const yOptions = [gridY + 1/6, gridY + 3/6, gridY + 5/6];
            snapY = findClosest(obj.y, yOptions);
        } else if (obj.type.endsWith('_third_v')) {
            snapY = gridY + 0.5;
            const xOptions = [gridX + 1/6, gridX + 3/6, gridX + 5/6];
            snapX = findClosest(obj.x, xOptions);
        } else if (obj.type.endsWith('_ninth_sq')) {
            const xOptions = [gridX + 1/6, gridX + 3/6, gridX + 5/6];
            const yOptions = [gridY + 1/6, gridY + 3/6, gridY + 5/6];
            snapX = findClosest(obj.x, xOptions);
            snapY = findClosest(obj.y, yOptions);
        } else if (obj.type.endsWith('_four_ninths_sq')) {
            const xOptions = [gridX + 1/3, gridX + 2/3];
            const yOptions = [gridY + 1/3, gridY + 2/3];
            snapX = findClosest(obj.x, xOptions);
            snapY = findClosest(obj.y, yOptions);
        } else {
            snapX = obj.x;
            snapY = obj.y;
        }

        obj.x = snapX;
        obj.y = snapY;
    }

    _snapFanToEdge(fan) {
        const gridX = Math.floor(fan.x); const gridY = Math.floor(fan.y);
        let bestCandidate = { distSq: Infinity, x: fan.x, y: fan.y, dir: fan.direction };
        const checks = [{ dx: 0, dy: -1, dir: 'down' },{ dx: 0, dy: 1, dir: 'up' },{ dx: -1, dy: 0, dir: 'right' },{ dx: 1, dy: 0, dir: 'left' }];
        for (const check of checks) {
            const tileX = gridX + check.dx; const tileY = gridY + check.dy;
            if (this.grid.isTileSolid(tileX, tileY)) {
                let snapX, snapY; const fanH_half_grid = (fan.height / 2) / GRID_CONSTANTS.TILE_SIZE;
                switch(check.dir) {
                    case 'up': snapX = tileX + 0.5; snapY = tileY - fanH_half_grid; break;
                    case 'down': snapX = tileX + 0.5; snapY = tileY + 1 + fanH_half_grid; break;
                    case 'left': snapX = tileX - fanH_half_grid; snapY = tileY + 0.5; break;
                    case 'right': snapX = tileX + 1 + fanH_half_grid; snapY = tileY + 0.5; break;
                }
                const distSq = (snapX - fan.x)**2 + (snapY - fan.y)**2;
                if (distSq < bestCandidate.distSq) { bestCandidate = { distSq, x: snapX, y: snapY, dir: check.dir }; }
            }
        }
        if (bestCandidate.distSq < 4) { fan.x = bestCandidate.x; fan.y = bestCandidate.y; fan.direction = bestCandidate.dir; }
    }

    _snapToGround(obj) {
        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const objBottomY_grid = obj.y + (obj.height / 2) / TILE_SIZE;
        const gridX = Math.floor(obj.x);
        for (let yOffset = 0; yOffset < 3; yOffset++) {
            const checkY = Math.floor(objBottomY_grid) + yOffset;
            if (this.grid.isTileSolid(gridX, checkY)) {
                const platformTopY_pixels = checkY * TILE_SIZE;
                const newCenterY_pixels = platformTopY_pixels - (obj.height / 2);
                obj.y = newCenterY_pixels / TILE_SIZE;
                return;
            }
        }
    }

    _updateGroundedEnemyBehavior(enemyObj) {

        const fullSnapTypes = ['mushroom', 'slime'];
        if (!fullSnapTypes.includes(enemyObj.type)) return;

        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const platformGridY = Math.floor(enemyObj.y + (enemyObj.height / 2 / TILE_SIZE));
        const startGridX = Math.floor(enemyObj.x);

        if (!this.grid.isTileSolid(startGridX, platformGridY)) return;

        let leftBound = startGridX;
        while (leftBound > 0 && this.grid.isTileSolid(leftBound - 1, platformGridY)) { leftBound--; }

        let rightBound = startGridX;
        while (rightBound < this.grid.width - 1 && this.grid.isTileSolid(rightBound + 1, platformGridY)) { rightBound++; }

        const platformWidthInPixels = (rightBound - leftBound + 1) * TILE_SIZE;
        const platformCenterPixels = (leftBound * TILE_SIZE) + (platformWidthInPixels / 2);

        enemyObj.x = platformCenterPixels / TILE_SIZE;
    }

    _getObjectDimensions(type) {
        if (ENEMY_DEFINITIONS[type]) {
            return { width: ENEMY_DEFINITIONS[type].width, height: ENEMY_DEFINITIONS[type].height };
        }
        switch(type) {
            case 'checkpoint': return { width: 64, height: 64 }; case 'trophy': return { width: 64, height: 64 };
            case 'player_spawn': return { width: 32, height: 32 }; case 'trampoline': return { width: 28, height: 28 };
            case 'spike': return { width: 16, height: 16 }; case 'fire_trap': return { width: 16, height: 16 };
            case 'spiked_ball': return { width: 28, height: 28 }; case 'arrow_bubble': return { width: 18, height: 18 };
            case 'fan': return { width: 24, height: 8 }; case 'falling_platform': return { width: 32, height: 10 };
            case 'rock_head': return { width: 42, height: 42 }; case 'spike_head': return { width: 54, height: 52 };
            case 'saw': return { width: 38, height: 38 };

            case 'wood_third_h': case 'stone_third_h': case 'gold_third_h': case 'orange_dirt_third_h': return { width: 48, height: 16 };
            case 'wood_third_v': case 'stone_third_v': case 'gold_third_v': case 'orange_dirt_third_v': return { width: 16, height: 48 };
            case 'wood_ninth_sq': case 'stone_ninth_sq': case 'gold_ninth_sq': case 'orange_dirt_ninth_sq': return { width: 16, height: 16 };
            case 'wood_four_ninths_sq': case 'stone_four_ninths_sq': case 'gold_four_ninths_sq': case 'orange_dirt_four_ninths_sq': return { width: 32, height: 32 };
            default: return { width: 28, height: 28 };
        }
    }
}