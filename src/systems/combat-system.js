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
}