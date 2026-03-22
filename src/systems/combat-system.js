import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { TrapComponent } from '../components/TrapComponent.js';
import { eventBus } from '../utils/event-bus.js';

export class CombatSystem {
    update(dt, { entityManager }) {
        const players = entityManager.query([PositionComponent, VelocityComponent, CollisionComponent, PlayerControlledComponent]);
        const traps = entityManager.query([TrapComponent]);

        for (const entityId of players) {
            const pos = entityManager.getComponent(entityId, PositionComponent);
            const vel = entityManager.getComponent(entityId, VelocityComponent);
            const col = entityManager.getComponent(entityId, CollisionComponent);
            const playerCtrl = entityManager.getComponent(entityId, PlayerControlledComponent);

            if (playerCtrl.isSpawning || playerCtrl.isDespawning || playerCtrl.needsRespawn) {
                continue;
            }

            const player = { pos, vel, col, entityId, entityManager, dt };

            // Check Trap Hazards
            for (const trapId of traps) {
                const trap = entityManager.getComponent(trapId, TrapComponent).trap;
                if (!trap.solid && this._isCollidingWith(pos, col, trap)) {
                    trap.onCollision(player, eventBus);
                }
            }
        }
    }

    _isCollidingWith(pos, col, other) {
        const hitbox = other.damageHitbox || other.hitbox || {
            x: other.x - (other.width || other.size) / 2,
            y: other.y - (other.height || other.size) / 2,
            width: other.width || other.size,
            height: other.height || other.size
        };
        return (
            pos.x < hitbox.x + hitbox.width &&
            pos.x + col.width > hitbox.x &&
            pos.y < hitbox.y + hitbox.height &&
            pos.y + col.height > hitbox.y
        );
    }
}