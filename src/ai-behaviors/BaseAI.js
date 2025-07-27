import { EnemyComponent } from '../components/EnemyComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { StateComponent } from '../components/StateComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { KillableComponent } from '../components/KillableComponent.js';

/**
 * Base class for all enemy AI behaviors.
 * Defines the common interface for the EnemySystem to use.
 */
export class BaseAI {
    /**
     * @param {number} entityId The ID of the enemy entity.
     * @param {import('../core/entity-manager.js').EntityManager} entityManager The entity manager to access components.
     * @param {object} level The current level data for collision checks.
     * @param {number|null} playerEntityId The player's entity ID for targeting.
     */
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

    _findPlatformEdges() {
        if (!this.level || !this.pos || !this.col) return null;

        const TILE_SIZE = 48;
        const checkY = Math.floor((this.pos.y + this.col.height + 1) / TILE_SIZE);

        if (checkY >= this.level.gridHeight || checkY < 0) return null;

        const startGridX = Math.floor((this.pos.x + this.col.width / 2) / TILE_SIZE);

        const initialTile = this.level.getTileAt(startGridX * TILE_SIZE, checkY * TILE_SIZE);
        if (!initialTile || !initialTile.solid || initialTile.oneWay) {
            return null;
        }

        let leftGridX = startGridX;
        while (leftGridX > 0) {
            const tile = this.level.getTileAt((leftGridX - 1) * TILE_SIZE, checkY * TILE_SIZE);
            if (!tile || !tile.solid || tile.oneWay) break;
            leftGridX--;
        }

        let rightGridX = startGridX;
        while (rightGridX < this.level.gridWidth - 1) {
            const tile = this.level.getTileAt((rightGridX + 1) * TILE_SIZE, checkY * TILE_SIZE);
            if (!tile || !tile.solid || tile.oneWay) break;
            rightGridX++;
        }
        
        // Correctly calculate the right edge based on the rightmost tile's collision box
        const rightTile = this.level.tiles[checkY][rightGridX];
        const rightEdge = (rightGridX * TILE_SIZE) + (rightTile.collisionBox ? rightTile.collisionBox.width : TILE_SIZE);

        return {
            left: leftGridX * TILE_SIZE,
            right: rightEdge,
        };
    }
}