import { eventBus } from '../utils/event-bus.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { BulletComponent } from '../components/BulletComponent.js';
import { DynamicColliderComponent } from '../components/DynamicColliderComponent.js';
import { PLAYER_CONSTANTS, EVENTS } from '../utils/constants.js';

export class BulletSystem {
    constructor(collisionSystem) {
        this.collisionSystem = collisionSystem;
        this.bulletQueue = [];
        this.bulletPool = [];
        eventBus.subscribe(EVENTS.SPAWN_BULLET, (data) => this.bulletQueue.push(data));
    }

    update(dt, { entityManager, level, playerEntityId }) {
        if (this.bulletQueue.length > 0) {
            this.bulletQueue.forEach(bulletData => this._spawnOrRecycleBullet(entityManager, bulletData));
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

            const recycleBullet = (playerCurrentPos) => {
                if (playerCurrentPos) {
                    const distance = Math.sqrt(Math.pow(playerCurrentPos.x - pos.x, 2) + Math.pow(playerCurrentPos.y - pos.y, 2));
                    const SOUND_RADIUS = 250;
                    if (distance < SOUND_RADIUS) {
                        eventBus.publish(EVENTS.PLAY_SOUND, { key: 'bullet_break', volume: 0.4, channel: 'SFX' });
                    }
                }

                if (bullet.piecesSpriteKey) {
                    eventBus.publish(EVENTS.CREATE_PARTICLES, { x: pos.x + col.width / 2, y: pos.y + col.height / 2, type: bullet.piecesSpriteKey, leafIndex: 0 });
                    eventBus.publish(EVENTS.CREATE_PARTICLES, { x: pos.x + col.width / 2, y: pos.y + col.height / 2, type: bullet.piecesSpriteKey, leafIndex: 1 });
                }

                // Deactivate and pool the bullet instead of destroying it
                entityManager.removeComponent(id, BulletComponent);
                if (renderable) renderable.isVisible = false;
                this.collisionSystem.removeDynamicEntity(id, entityManager);
                this.bulletPool.push(id);
            };

            if (playerPos && playerCol) {
                if (
                    pos.x < playerPos.x + playerCol.width &&
                    pos.x + col.width > playerPos.x &&
                    pos.y < playerPos.y + playerCol.height &&
                    pos.y + col.height > playerPos.y
                ) {
                    eventBus.publish(EVENTS.PLAYER_TOOK_DAMAGE, { amount: bullet.damage, source: 'bullet' });
                    recycleBullet(playerPos);
                    continue;
                }
            }

            if (col.isGrounded || col.isAgainstWall || col.hitCeiling) {
                recycleBullet(playerPos);
                continue;
            }

            if (renderable.spriteKey === 'bee_bullet') {
                vel.vy += PLAYER_CONSTANTS.GRAVITY * dt * 0.5;
            }

            if (pos.y >= level.height || pos.y <= 0 || pos.x <= 0 || pos.x + col.width >= level.width) {
                recycleBullet(playerPos);
                continue;
            }
        }
    }

    _spawnOrRecycleBullet(entityManager, { x, y, vx, vy, config, spriteKey = 'bee_bullet', rotation = 0, piecesSpriteKey = null }) {
        if (this.bulletPool.length > 0) {
            const bulletId = this.bulletPool.pop();

            // Reactivate and update components
            const pos = entityManager.getComponent(bulletId, PositionComponent);
            const vel = entityManager.getComponent(bulletId, VelocityComponent);
            const renderable = entityManager.getComponent(bulletId, RenderableComponent);

            pos.x = x - config.width / 2;
            pos.y = y;
            vel.vx = vx ?? 0;
            vel.vy = vy ?? config.speed;
            renderable.spriteKey = spriteKey;
            renderable.rotation = rotation;
            renderable.isVisible = true;

            entityManager.addComponent(bulletId, new BulletComponent({ damage: config.damage, speed: config.speed, piecesSpriteKey: piecesSpriteKey }));
        } else {
            // Create a new entity if the pool is empty
            const bulletId = entityManager.createEntity();
            entityManager.addComponent(bulletId, new PositionComponent(x - config.width / 2, y));
            entityManager.addComponent(bulletId, new VelocityComponent(vx ?? 0, vy ?? config.speed));
            entityManager.addComponent(bulletId, new DynamicColliderComponent());
            entityManager.addComponent(bulletId, new CollisionComponent({ type: 'hazard', width: config.width, height: config.height }));
            entityManager.addComponent(bulletId, new RenderableComponent({ spriteKey: spriteKey, width: config.width, height: config.height, rotation: rotation }));
            entityManager.addComponent(bulletId, new BulletComponent({ damage: config.damage, speed: config.speed, piecesSpriteKey: piecesSpriteKey }));
        }
    }
}