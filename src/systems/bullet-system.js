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
        this.bulletPool = []; // Pool for reusing bullet entities
        eventBus.subscribe('spawnBullet', (data) => this.bulletQueue.push(data));
        
        // Clear stale bullet IDs when a level is loaded/restarted
        eventBus.subscribe('levelLoaded', () => {
            this.bulletQueue = [];
            this.bulletPool = [];
        });
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
            const bullet = entityManager.getComponent(id, BulletComponent);
            if (!bullet.active) continue;

            const pos = entityManager.getComponent(id, PositionComponent);
            const vel = entityManager.getComponent(id, VelocityComponent);
            const col = entityManager.getComponent(id, CollisionComponent);
            const renderable = entityManager.getComponent(id, RenderableComponent);

            const destroyBullet = (playerCurrentPos) => {
                if (playerCurrentPos) {
                    const distance = Math.sqrt(Math.pow(playerCurrentPos.x - pos.x, 2) + Math.pow(playerCurrentPos.y - pos.y, 2));
                    const SOUND_RADIUS = 250;
                    if (distance < SOUND_RADIUS) {
                        eventBus.publish('playSound', { key: 'bullet_break', volume: 0.4, channel: 'SFX' });
                    }
                }

                if (bullet.piecesSpriteKey) {
                    eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height / 2, type: bullet.piecesSpriteKey, leafIndex: 0 });
                    eventBus.publish('createParticles', { x: pos.x + col.width / 2, y: pos.y + col.height / 2, type: bullet.piecesSpriteKey, leafIndex: 1 });
                }
                
                this.collisionSystem.removeDynamicEntity(id, entityManager);
                entityManager.removeComponent(id, DynamicColliderComponent);
                
                bullet.active = false;
                renderable.isVisible = false;
                pos.x = -9999;
                pos.y = -9999;
                vel.vx = 0;
                vel.vy = 0;
                
                this.bulletPool.push(id);
            };

            if (playerPos && playerCol) {
                if (
                    pos.x < playerPos.x + playerCol.width &&
                    pos.x + col.width > playerPos.x &&
                    pos.y < playerPos.y + playerCol.height &&
                    pos.y + col.height > playerPos.y
                ) {
                    eventBus.publish('playerTookDamage', { amount: bullet.damage, source: 'bullet' });
                    destroyBullet(playerPos);
                    continue;
                }
            }

            if (col.isGrounded || col.isAgainstWall || col.hitCeiling) {
                destroyBullet(playerPos);
                continue;
            }

            if (renderable.spriteKey === 'bee_bullet') {
                vel.vy += PLAYER_CONSTANTS.GRAVITY * dt * 0.5;
            }

            if (pos.y >= level.height || pos.y <= 0 || pos.x <= 0 || pos.x + col.width >= level.width) {
                destroyBullet(playerPos);
                continue;
            }
        }
    }

    _createBullet(entityManager, { x, y, vx, vy, config, spriteKey = 'bee_bullet', rotation = 0, piecesSpriteKey = null }) {
        let bulletId = null;

        // Extract a valid entity from the pool (failsafe check to ensure the entity is valid in the current EntityManager)
        while (this.bulletPool.length > 0) {
            const id = this.bulletPool.pop();
            if (entityManager.hasComponent(id, PositionComponent)) {
                bulletId = id;
                break;
            }
        }

        if (bulletId !== null) {
            const pos = entityManager.getComponent(bulletId, PositionComponent);
            const vel = entityManager.getComponent(bulletId, VelocityComponent);
            const col = entityManager.getComponent(bulletId, CollisionComponent);
            const rend = entityManager.getComponent(bulletId, RenderableComponent);
            const bul = entityManager.getComponent(bulletId, BulletComponent);
            
            pos.x = x - config.width / 2; pos.y = y;
            vel.vx = vx ?? 0; vel.vy = vy ?? config.speed;
            col.width = config.width; col.height = config.height;
            col.isGrounded = false; col.isAgainstWall = false; col.hitCeiling = false;
            rend.spriteKey = spriteKey; rend.width = config.width; rend.height = config.height; rend.rotation = rotation; rend.isVisible = true;
            bul.damage = config.damage; bul.speed = config.speed; bul.piecesSpriteKey = piecesSpriteKey; bul.active = true;
            
            entityManager.addComponent(bulletId, new DynamicColliderComponent());
        } else {
            bulletId = entityManager.createEntity();
            entityManager.addComponent(bulletId, new PositionComponent(x - config.width / 2, y));
            entityManager.addComponent(bulletId, new VelocityComponent(vx ?? 0, vy ?? config.speed));
            entityManager.addComponent(bulletId, new DynamicColliderComponent());
            entityManager.addComponent(bulletId, new CollisionComponent({ type: 'hazard', width: config.width, height: config.height }));
            entityManager.addComponent(bulletId, new RenderableComponent({ spriteKey: spriteKey, width: config.width, height: config.height, rotation: rotation }));
            entityManager.addComponent(bulletId, new BulletComponent({ damage: config.damage, speed: config.speed, piecesSpriteKey: piecesSpriteKey }));
        }
    }
}