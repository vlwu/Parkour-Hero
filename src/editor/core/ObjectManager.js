import { GRID_CONSTANTS } from '../../utils/constants.js';
import { ENEMY_DEFINITIONS } from '../../entities/enemy-definitions.js';

const round = (val) => Math.round(val * 100) / 100;

export class ObjectManager {
    constructor(grid, view) {
        this.grid = grid;
        this.view = view;
        this.objects = [];
        this.nextObjectId = 0;
    }

    clear() {
        this.objects = [];
        this.view.renderObjects(this.objects);
    }

    load(levelData) {
        this.nextObjectId = 0;
        this.objects = [];

        const allEntities = [
            ...(levelData.entities || [])
        ];

        allEntities.forEach(entityData => {
            const type = entityData[0];
            const x = entityData[1];
            const y = entityData[2];
            const { width, height } = this._getObjectDimensions(type);

            const obj = { type, x, y, id: this.nextObjectId++, width, height };

            let propIndex = 3;
            switch (type) {
                case 'fire_trap':
                    obj.chainLength = entityData[propIndex++];
                    break;
                case 'spiked_ball':
                    obj.chainLength = entityData[propIndex++];
                    obj.swingArc = entityData[propIndex++];
                    obj.period = entityData[propIndex++];
                    obj.tiltAmount = entityData[propIndex++];
                    break;
                case 'arrow_bubble':
                    obj.direction = entityData[propIndex++];
                    obj.knockbackSpeed = entityData[propIndex++];
                    break;
                case 'plant':
                    obj.direction = entityData[propIndex++];
                    break;
                case 'fan':
                    obj.direction = entityData[propIndex++];
                    obj.pushStrength = entityData[propIndex++];
                    obj.windHeight = entityData[propIndex++];
                    break;
                case 'saw':
                    obj.direction = entityData[propIndex++];
                    obj.distance = entityData[propIndex++];
                    obj.speed = entityData[propIndex++];
                    break;
                case 'bluebird':
                    obj.patrolDistance = entityData[propIndex++];
                    obj.horizontalSpeed = entityData[propIndex++];
                    obj.verticalAmplitude = entityData[propIndex++];
                    break;
                case 'radish':
                case 'bee':
                    obj.patrolBoxSize = entityData[propIndex++];
                    break;
            }
            this.objects.push(obj);
        });

        if (levelData.startPosition) {
            let startX, startY;
            if (Array.isArray(levelData.startPosition)) {
                startX = levelData.startPosition[0];
                startY = levelData.startPosition[1];
            } else if (typeof levelData.startPosition === 'object' && levelData.startPosition !== null) {
                startX = levelData.startPosition.x;
                startY = levelData.startPosition.y;
            }

            if (startX !== undefined && startY !== undefined) {
                const { width, height } = this._getObjectDimensions('player_spawn');
                this.objects.push({
                    id: this.nextObjectId++,
                    type: 'player_spawn',
                    x: startX,
                    y: startY,
                    width,
                    height
                });
            }
        }
        this.view.renderObjects(this.objects);
    }
    addObject(type, pixelX, pixelY) {
        let replacedSpawn = null;
        if (type === 'player_spawn') {
            const existingIndex = this.objects.findIndex(o => o.type === 'player_spawn');
            if (existingIndex > -1) {
                replacedSpawn = this.objects.splice(existingIndex, 1);
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
        if (type === 'plant') {
            newObject.direction = 'right';
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
        if (type === 'radish' || type === 'bee') {
            newObject.patrolBoxSize = 150;
        }

        this._applySnapping(newObject);
        this._updateGroundedEnemyBehavior(newObject);

        newObject.x = round(newObject.x);
        newObject.y = round(newObject.y);

        this.objects.push(newObject);
        this.view.renderObjects(this.objects);
        return { newObject, replacedSpawn };
    }

    addObjectInstance(obj) {
        this.objects.push(obj);
        this.view.renderObjects(this.objects);
    }

    deleteObject(id) {
        const index = this.objects.findIndex(o => o.id === id);
        if (index === -1) return null;
        const deletedObject = this.objects.splice(index, 1);
        this.view.renderObjects(this.objects);
        return deletedObject;
    }

    updateObjectProp(id, prop, value) {
        const obj = this.getObject(id);
        if (obj) {
            obj[prop] = value;
            this.view.renderObjects(this.objects);
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
        const startPos = playerSpawn ? [round(playerSpawn.x), round(playerSpawn.y)] : [1.5, this.grid.height - 2.5];

        const finalEntities = [];
        this.objects.forEach(obj => {
            if (obj.type === 'player_spawn') return;

            const entityArray = [obj.type, round(obj.x), round(obj.y)];

            switch (obj.type) {
                case 'fire_trap':
                    entityArray.push(obj.chainLength);
                    break;
                case 'spiked_ball':
                    entityArray.push(obj.chainLength, obj.swingArc, obj.period, obj.tiltAmount);
                    break;
                case 'arrow_bubble':
                    entityArray.push(obj.direction, obj.knockbackSpeed);
                    break;
                case 'plant':
                    entityArray.push(obj.direction);
                    break;
                case 'fan':
                    entityArray.push(obj.direction, obj.pushStrength, obj.windHeight);
                    break;
                case 'saw':
                    entityArray.push(obj.direction, obj.distance, obj.speed);
                    break;
                case 'bluebird':
                    entityArray.push(obj.patrolDistance, obj.horizontalSpeed, obj.verticalAmplitude);
                    break;
                case 'radish':
                case 'bee':
                    entityArray.push(obj.patrolBoxSize);
                    break;
            }
            finalEntities.push(entityArray);
        });

        return { startPos, finalEntities };
    }

    _applySnapping(obj) {
        const groundEnemies = Object.keys(ENEMY_DEFINITIONS).filter(key => !['bluebird', 'fatbird', 'radish', 'bee', 'bat'].includes(key));
        const groundSnappable = ['trophy', 'checkpoint', 'trampoline', 'spike', 'fire_trap', ...groundEnemies];
        const ceilingSnappable = ['bat'];

        if (groundSnappable.includes(obj.type)) {
            this._snapToGround(obj);
        } else if (ceilingSnappable.includes(obj.type)) {
            this._snapToCeiling(obj);
        } else if (obj.type === 'fan') {
            this._snapFanToEdge(obj);
        }
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

    _snapToCeiling(obj) {
        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const objTopY_grid = obj.y - (obj.height / 2) / TILE_SIZE;
        const gridX = Math.floor(obj.x);
        for (let yOffset = 0; yOffset < 3; yOffset++) {
            const checkY = Math.floor(objTopY_grid) - yOffset;
            if (this.grid.isTileSolid(gridX, checkY)) {
                const platformBottomY_pixels = (checkY + 1) * TILE_SIZE;
                const newCenterY_pixels = platformBottomY_pixels + (obj.height / 2);
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
            default: return { width: 28, height: 28 };
        }
    }
}