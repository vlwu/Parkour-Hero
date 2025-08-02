import { eventBus } from '../utils/event-bus.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { BulletComponent } from '../components/BulletComponent.js';
import { DynamicColliderComponent } from '../components/DynamicColliderComponent.js';
import { PLAYER_CONSTANTS } from '../utils/constants.js';

export class BulletSystem {
    constructor(collisionSystem) {
        this.collisionSystem = collisionSystem;
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
            const renderable = entityManager.getComponent(id, RenderableComponent);

            if (playerPos && playerCol) {
                if (
                    pos.x < playerPos.x + playerCol.width &&
                    pos.x + col.width > playerPos.x &&
                    pos.y < playerPos.y + playerCol.height &&
                    pos.y + col.height > playerPos.y
                ) {
                    eventBus.publish('playerTookDamage', { amount: bullet.damage, source: 'bullet' });
                    this.collisionSystem.removeDynamicEntity(id, entityManager);
                    entityManager.destroyEntity(id);
                    continue;
                }
            }

            if (col.isGrounded || col.isAgainstWall) {
                const piecesSpriteKey = renderable.spriteKey === 'bee_bullet' ? 'bee_bullet_pieces' : 'plant_bullet_pieces';
                eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height / 2, type: piecesSpriteKey, leafIndex: 0 });
                eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height / 2, type: piecesSpriteKey, leafIndex: 1 });
                this.collisionSystem.removeDynamicEntity(id, entityManager);
                entityManager.destroyEntity(id);
                continue;
            }

            if (renderable.spriteKey === 'bee_bullet') {
                vel.vy += PLAYER_CONSTANTS.GRAVITY * dt * 0.5;
            }

            if (pos.y > level.height || pos.y < 0 || pos.x < 0 || pos.x > level.width) {
                this.collisionSystem.removeDynamicEntity(id, entityManager);
                entityManager.destroyEntity(id);
            }
        }
    }

    _createBullet(entityManager, { x, y, vx, vy, config, spriteKey = 'bee_bullet' }) {
        const bulletId = entityManager.createEntity();

        entityManager.addComponent(bulletId, new PositionComponent(x - config.width / 2, y));
        entityManager.addComponent(bulletId, new VelocityComponent(vx || 0, vy || config.speed));
        entityManager.addComponent(bulletId, new DynamicColliderComponent());
        entityManager.addComponent(bulletId, new CollisionComponent({ type: 'hazard', width: config.width, height: config.height }));
        entityManager.addComponent(bulletId, new RenderableComponent({ spriteKey: spriteKey, width: config.width, height: config.height }));
        entityManager.addComponent(bulletId, new BulletComponent({ damage: config.damage, speed: config.speed }));
    }
}