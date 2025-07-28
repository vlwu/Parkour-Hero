import { eventBus } from '../utils/event-bus.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { BulletComponent } from '../components/BulletComponent.js';
import { DynamicColliderComponent } from '../components/DynamicColliderComponent.js';
import { PLAYER_CONSTANTS } from '../utils/constants.js';

export class BulletSystem {
    constructor() {
        this.bulletQueue = [];
        eventBus.subscribe('spawnBullet', (data) => this.bulletQueue.push(data));
    }

    update(dt, { entityManager, level, playerEntityId }) {
        if (this.bulletQueue.length > 0) {
            this.bulletQueue.forEach(bulletData => this._createBullet(entityManager, bulletData));
            this.bulletQueue = [];
        }

        const bulletEntities = entityManager.query([BulletComponent, PositionComponent, VelocityComponent, CollisionComponent]);
        const playerPos = playerEntityId ? entityManager.getComponent(playerEntityId, PositionComponent) : null;
        const playerCol = playerEntityId ? entityManager.getComponent(playerEntityId, CollisionComponent) : null;

        for (const id of bulletEntities) {
            const pos = entityManager.getComponent(id, PositionComponent);
            const vel = entityManager.getComponent(id, VelocityComponent);
            const col = entityManager.getComponent(id, CollisionComponent);
            const bullet = entityManager.getComponent(id, BulletComponent);

            if (playerPos && playerCol) {
                if (
                    pos.x < playerPos.x + col.width &&
                    pos.x + col.width > playerPos.x &&
                    pos.y < playerPos.y + col.height &&
                    pos.y + col.height > playerPos.y
                ) {
                    eventBus.publish('playerTookDamage', { amount: bullet.damage, source: 'bullet' });
                    entityManager.destroyEntity(id);
                    continue;
                }
            }

            // Check if the collision system (which runs before this system) has flagged the bullet as grounded.
            if (col.isGrounded) {
                eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height, type: 'bee_bullet_pieces', leafIndex: 0 });
                eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height, type: 'bee_bullet_pieces', leafIndex: 1 });
                entityManager.destroyEntity(id);
                continue;
            }

            // If not destroyed, apply gravity to affect velocity for the *next* frame
            vel.vy += PLAYER_CONSTANTS.GRAVITY * dt * 0.5; // Use half gravity for a less aggressive arc

            if (pos.y > level.height) {
                entityManager.destroyEntity(id);
            }
        }
    }

    _createBullet(entityManager, { x, y, config }) {
        const bulletId = entityManager.createEntity();

        entityManager.addComponent(bulletId, new PositionComponent(x - config.width / 2, y));
        entityManager.addComponent(bulletId, new VelocityComponent(0, config.speed));
        entityManager.addComponent(bulletId, new DynamicColliderComponent());
        entityManager.addComponent(bulletId, new CollisionComponent({ type: 'hazard', width: config.width, height: config.height }));
        entityManager.addComponent(bulletId, new RenderableComponent({ spriteKey: 'bee_bullet', width: config.width, height: config.height }));
        entityManager.addComponent(bulletId, new BulletComponent({ damage: config.damage, speed: config.speed }));
    }
}