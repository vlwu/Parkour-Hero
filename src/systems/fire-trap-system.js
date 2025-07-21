import { eventBus } from '../utils/event-bus.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { PeriodicDamageComponent } from '../components/PeriodicDamageComponent.js';

export class FireTrapSystem {
    constructor() {}

    update(dt, { entityManager }) {
        const playerEntities = entityManager.query([PlayerControlledComponent, PositionComponent, CollisionComponent, VelocityComponent]);
        const fireTraps = entityManager.query([RenderableComponent, PositionComponent, CollisionComponent, PeriodicDamageComponent]);

        if (playerEntities.length === 0) return;
        const playerEntityId = playerEntities[0];
        const playerPos = entityManager.getComponent(playerEntityId, PositionComponent);
        const playerCol = entityManager.getComponent(playerEntityId, CollisionComponent);
        const playerVel = entityManager.getComponent(playerEntityId, VelocityComponent);

        for (const trapId of fireTraps) {
            const trapRender = entityManager.getComponent(trapId, RenderableComponent);
            
            if (trapRender.spriteKey !== 'fire') continue;
            
            if (!trapRender.animationConfig) continue;

            const trapPos = entityManager.getComponent(trapId, PositionComponent);
            const trapCol = entityManager.getComponent(trapId, CollisionComponent);
            const damageComp = entityManager.getComponent(trapId, PeriodicDamageComponent);
            
            // MODIFICATION: A more robust check for whether the player is standing on the trap.
            const pBottom = playerPos.y + playerCol.height;
            const pRight = playerPos.x + playerCol.width;
            const trapTop = trapPos.y - trapCol.height / 2;
            const trapLeft = trapPos.x - trapCol.width / 2;
            const trapRight = trapPos.x + trapCol.width / 2;

            const playerIsOnTop = pRight > trapLeft && playerPos.x < trapRight && pBottom >= trapTop && pBottom < trapTop + 5 && playerVel.vy >= 0;

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
            
            if (trapRender.animationState === 'on' && playerIsOnTop) {
                damageComp.damageTimer += dt;
                if (damageComp.damageTimer >= damageComp.interval) {
                    damageComp.damageTimer = 0; 
                    eventBus.publish('playerTookDamage', { amount: damageComp.amount, source: damageComp.source });
                }
            } else {
                damageComp.damageTimer = 0;
            }
        }
    }
}