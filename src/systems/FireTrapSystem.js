import { eventBus } from '../utils/event-bus.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { PeriodicDamageComponent } from '../components/PeriodicDamageComponent.js';

export class FireTrapSystem {
    constructor() {}

    update(dt, { entityManager }) {
        const playerEntities = entityManager.query([PlayerControlledComponent, PositionComponent, CollisionComponent]);
        const fireTraps = entityManager.query([RenderableComponent, PositionComponent, CollisionComponent, PeriodicDamageComponent]);

        if (playerEntities.length === 0) return;
        const playerEntityId = playerEntities[0];
        const playerPos = entityManager.getComponent(playerEntityId, PositionComponent);
        const playerCol = entityManager.getComponent(playerEntityId, CollisionComponent);

        for (const trapId of fireTraps) {
            const trapRender = entityManager.getComponent(trapId, RenderableComponent);
            
            if (trapRender.spriteKey !== 'fire') continue;
            
            // MODIFICATION: Add a guard to ensure animation config exists before using it.
            if (!trapRender.animationConfig) continue;

            const trapPos = entityManager.getComponent(trapId, PositionComponent);
            const trapCol = entityManager.getComponent(trapId, CollisionComponent);
            const damageComp = entityManager.getComponent(trapId, PeriodicDamageComponent);
            
            const playerIsOnTop = Math.abs((playerPos.y + playerCol.height) - (trapPos.y - trapCol.height / 2)) < 5 &&
                                  playerPos.x + playerCol.width > trapPos.x - trapCol.width / 2 &&
                                  playerPos.x < trapPos.x + trapCol.width / 2;

            // MODIFICATION: Rewritten as a clean if/else if state machine to prevent logic errors.
            const currentState = trapRender.animationState;

            if (currentState === 'off' && playerIsOnTop) {
                trapRender.animationState = 'hit'; 
                trapRender.animationFrame = 0;
                eventBus.publish('playSound', { key: 'fire_activated', volume: 0.8, channel: 'SFX' });
            } else if (currentState === 'hit' && trapRender.animationFrame >= trapRender.animationConfig.hit.frames - 1) {
                trapRender.animationState = 'on';
                trapRender.animationFrame = 0;
            } else if (currentState === 'on' && !playerIsOnTop) {
                trapRender.animationState = 'off';
            }
            
            if (trapRender.animationState === 'on') {
                damageComp.damageTimer += dt;
                if (damageComp.damageTimer >= damageComp.interval) {
                    damageComp.damageTimer = 0; // Reset timer after dealing damage
                    const flameHeight = trapRender.height;
                    const flameY = trapPos.y - flameHeight / 2;
                    const flameHitbox = { x: trapPos.x - trapCol.width/2, y: flameY, width: trapCol.width, height: flameHeight };

                    if (playerPos.x < flameHitbox.x + flameHitbox.width && playerPos.x + playerCol.width > flameHitbox.x &&
                        playerPos.y < flameHitbox.y + flameHitbox.height && playerPos.y + playerCol.height > flameY)
                    {
                         eventBus.publish('playerTookDamage', { amount: damageComp.amount, source: damageComp.source });
                    }
                }
            } else {
                damageComp.damageTimer = 0;
            }
        }
    }
}