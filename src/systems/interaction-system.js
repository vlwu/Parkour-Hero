import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { eventBus } from '../utils/event-bus.js';

export class InteractionSystem {
    update(dt, { entityManager, level }) {
        const players = entityManager.query([PositionComponent, CollisionComponent, VelocityComponent, PlayerControlledComponent]);

        for (const entityId of players) {
            const pos = entityManager.getComponent(entityId, PositionComponent);
            const col = entityManager.getComponent(entityId, CollisionComponent);
            const vel = entityManager.getComponent(entityId, VelocityComponent);
            const playerCtrl = entityManager.getComponent(entityId, PlayerControlledComponent);

            if (playerCtrl.isSpawning || playerCtrl.isDespawning || playerCtrl.needsRespawn) {
                continue;
            }

            this._checkFruitCollisions(pos, col, level, entityId, entityManager);
            this._checkTrophyCollision(pos, col, level.trophy, entityId, entityManager, vel, dt);
            this._checkCheckpointCollisions(pos, col, level, entityId, entityManager);
        }
    }

    _isCollidingWith(pos, col, other) {
        let hx, hy, hw, hh;
        if (other.damageHitbox) {
            hx = other.damageHitbox.x;
            hy = other.damageHitbox.y;
            hw = other.damageHitbox.width;
            hh = other.damageHitbox.height;
        } else if (other.hitbox) {
            hx = other.hitbox.x;
            hy = other.hitbox.y;
            hw = other.hitbox.width;
            hh = other.hitbox.height;
        } else {
            hw = other.width || other.size;
            hh = other.height || other.size;
            hx = other.x - hw / 2;
            hy = other.y - hh / 2;
        }

        return (
            pos.x < hx + hw &&
            pos.x + col.width > hx &&
            pos.y < hy + hh &&
            pos.y + col.height > hy
        );
    }

    _isRectColliding(rectA, rectB) {
        return (
            rectA.x < rectB.x + rectB.width &&
            rectA.x + rectA.width > rectB.x &&
            rectA.y < rectB.y + rectB.height &&
            rectA.y + rectA.height > rectB.y
        );
    }

    _checkFruitCollisions(pos, col, level, entityId, entityManager) {
        for (const fruit of level.getActiveFruits()) {
            if (this._isCollidingWith(pos, col, fruit)) {
                eventBus.publish('collisionEvent', { type: 'fruit', entityId, target: fruit, entityManager });
            }
        }
    }

    _checkTrophyCollision(pos, col, trophy, entityId, entityManager, vel, dt) {
        if (!trophy || trophy.inactive || trophy.acquired) return;
        const collisionOffset = 15;
        const trophyHitbox = { x: trophy.x - trophy.size / 2, y: (trophy.y - trophy.size / 2) + collisionOffset, width: trophy.size, height: trophy.size - collisionOffset };

        if (!this._isRectColliding({ x: pos.x, y: pos.y, width: col.width, height: col.height }, trophyHitbox)) {
            return;
        }

        const prevPlayerBottom = (pos.y + col.height) - vel.vy * dt;
        if (vel.vy >= 0 && prevPlayerBottom <= trophyHitbox.y) {
            if (!trophy.isAnimating) {
                trophy.isAnimating = true;
                const playerCtrl = entityManager.getComponent(entityId, PlayerControlledComponent);
                if (playerCtrl) {
                    playerCtrl.inputLocked = true;
                }
                eventBus.publish('playerKnockback', { entityId, entityManager, vx: 0, vy: -300 });
                eventBus.publish('playSound', { key: 'trophy_activated', volume: 0.9, channel: 'UI' });
                eventBus.publish('cameraShakeRequested', { intensity: 6, duration: 0.25 });
            }
            return;
        }

        if (vel.vx > 0) {
            pos.x = trophyHitbox.x - col.width;
            vel.vx = 0;
        } else if (vel.vx < 0) {
            pos.x = trophyHitbox.x + trophyHitbox.width;
            vel.vx = 0;
        }
    }

    _checkCheckpointCollisions(pos, col, level, entityId, entityManager) {
        for (const cp of level.getInactiveCheckpoints()) {
            if (this._isCollidingWith(pos, col, cp)) {
                eventBus.publish('collisionEvent', { type: 'checkpoint', entityId, target: cp, entityManager });
            }
        }
    }
}