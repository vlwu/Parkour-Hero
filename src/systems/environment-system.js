import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { GRID_CONSTANTS } from '../utils/constants.js';
import { eventBus } from '../utils/event-bus.js';

export class EnvironmentSystem {
    update(_dt, { entityManager, level }) {
        const entities = entityManager.query([PositionComponent, VelocityComponent, CollisionComponent, PlayerControlledComponent]);

        for (const entityId of entities) {
            const pos = entityManager.getComponent(entityId, PositionComponent);
            const vel = entityManager.getComponent(entityId, VelocityComponent);
            const col = entityManager.getComponent(entityId, CollisionComponent);
            const playerCtrl = entityManager.getComponent(entityId, PlayerControlledComponent);

            if (playerCtrl.isSpawning || playerCtrl.isDespawning || playerCtrl.needsRespawn) {
                continue;
            }

            this._handleMudInteraction(entityId, pos, col, vel, playerCtrl, level);
        }
    }

    _handleMudInteraction(entityId, pos, col, vel, playerCtrl, level) {
        if (playerCtrl.ignoreSurfaceEffects) return;

        const PROBE_POINTS = 5;
        let mudPoints = 0;
        let highestMudY = -Infinity;

        for (let i = 0; i < PROBE_POINTS; i++) {
            const probeX = pos.x + (col.width / (PROBE_POINTS - 1)) * i;
            const probeY = pos.y + col.height + 1;
            const tileProps = level.getTilePropertiesAt(probeX, probeY);

            if (tileProps && tileProps.interaction === 'mud') {
                mudPoints++;
                const tileGridY = Math.floor(probeY / GRID_CONSTANTS.TILE_SIZE);
                const tileTopY = tileGridY * GRID_CONSTANTS.TILE_SIZE;
                if (tileTopY > highestMudY) {
                    highestMudY = tileTopY;
                }
            }
        }

        const isSubstantiallyOnMud = (mudPoints / PROBE_POINTS) >= 0.8;

        if (isSubstantiallyOnMud) {
            if (vel.vy >= 0) {
                if (!playerCtrl.isInMud) {
                    playerCtrl.isInMud = true;
                    eventBus.publish('createParticles', {
                        x: pos.x + col.width / 2,
                        y: highestMudY,
                        type: 'mud_splash'
                    });
                    eventBus.publish('playSound', { key: 'mud_splat', volume: 0.8, channel: 'SFX' });
                }
                pos.y = highestMudY - col.height + playerCtrl.mudSinkAmount;
                vel.vy = 0;
                col.isGrounded = true;
                col.groundType = 'mud';
            }
        } else if (playerCtrl.isInMud) {
            playerCtrl.isInMud = false;
        }
    }
}