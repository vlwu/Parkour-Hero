import { TrapComponent } from '../components/TrapComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { eventBus } from '../utils/event-bus.js';

export class TrapSystem {
    update(dt, { entityManager, playerEntityId, level }) {
        const playerPos = playerEntityId !== null ? entityManager.getComponent(playerEntityId, PositionComponent) : null;
        const playerCol = playerEntityId !== null ? entityManager.getComponent(playerEntityId, CollisionComponent) : null;
        const playerCtrl = playerEntityId !== null ? entityManager.getComponent(playerEntityId, PlayerControlledComponent) : null;

        const playerData = playerPos && playerCol ? { ...playerPos, width: playerCol.width, height: playerCol.height } : null;
        const groundEntity = playerCol ? playerCol.groundEntity : null;

        const trapEntities = entityManager.query([TrapComponent]);
        for (const entityId of trapEntities) {
            const trapComp = entityManager.getComponent(entityId, TrapComponent);
            const trap = trapComp.trap;

            // Update the trap utilizing the OOP logic, but fed via the ECS system
            trap.update(dt, playerData, eventBus, level, groundEntity, playerCtrl);

            if (trap.isExpired) {
                if (trap.gridObject) {
                    level.spatialGrid.removeObjectFromCells(trap.id, level.spatialGrid.getGridIndices(trap.gridObject));
                }
                if (trap.type === 'slime_puddle') {
                    level.slimePuddlePool.push(trap);
                }
                entityManager.destroyEntity(entityId);
            }
        }
    }
}