import { EnemyComponent } from '../components/EnemyComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { StateComponent } from '../components/StateComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { KillableComponent } from '../components/KillableComponent.js';
import { GRID_CONSTANTS } from '../utils/constants.js';

export class BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        this.entityId = entityId;
        this.entityManager = entityManager;
        this.level = level;
        this.playerEntityId = playerEntityId;

        this.enemy = this.entityManager.getComponent(this.entityId, EnemyComponent);
        this.pos = this.entityManager.getComponent(this.entityId, PositionComponent);
        this.vel = this.entityManager.getComponent(this.entityId, VelocityComponent);
        this.state = this.entityManager.getComponent(this.entityId, StateComponent);
        this.renderable = this.entityManager.getComponent(this.entityId, RenderableComponent);
        this.col = this.entityManager.getComponent(this.entityId, CollisionComponent);
        this.killable = this.entityManager.getComponent(this.entityId, KillableComponent);
    }

    update(dt) {
        throw new Error("AI Behavior 'update' method must be implemented.");
    }

    _getPlatformEdgesForEntity(pos, col) {
        if (!this.level || !pos || !col) return null;

        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const checkY = pos.y + col.height + 1;
        const checkX = pos.x + col.width / 2;

        const initialTileProps = this.level.getTilePropertiesAt(checkX, checkY);
        if (!initialTileProps || !initialTileProps.solid || initialTileProps.oneWay) {
            return null;
        }

        const startGridX = Math.floor(checkX / TILE_SIZE);
        const gridY = Math.floor(checkY / TILE_SIZE);

        let leftGridX = startGridX;
        while (leftGridX > 0) {
            const props = this.level.getTilePropertiesAt((leftGridX - 1) * TILE_SIZE, checkY);
            if (!props || !props.solid || props.oneWay) break;
            leftGridX--;
        }

        let rightGridX = startGridX;
        while (rightGridX < this.level.gridWidth - 1) {
            const props = this.level.getTilePropertiesAt((rightGridX + 1) * TILE_SIZE, checkY);
            if (!props || !props.solid || props.oneWay) break;
            rightGridX++;
        }

        const rightTileProps = this.level.getTilePropertiesAt(rightGridX * TILE_SIZE, checkY);
        const rightEdgeWidth = rightTileProps.collisionBox ? rightTileProps.collisionBox.width : TILE_SIZE;

        return {
            left: leftGridX * TILE_SIZE,
            right: (rightGridX * TILE_SIZE) + rightEdgeWidth,
        };
    }

    _findPlatformEdges() {
        return this._getPlatformEdgesForEntity(this.pos, this.col);
    }
}