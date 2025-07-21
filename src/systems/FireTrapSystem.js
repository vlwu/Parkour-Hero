// src/systems/FireTrapSystem.js

import { eventBus } from '../utils/event-bus.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { PeriodicDamageComponent } from '../components/PeriodicDamageComponent.js';

export class FireTrapSystem {
    constructor() {
        this.trapStates = new Map();
    }

    update(dt, { entityManager }) {
        const playerEntities = entityManager.query([PlayerControlledComponent, PositionComponent, CollisionComponent]);
        const fireTraps = entityManager.query([RenderableComponent, PositionComponent, CollisionComponent, PeriodicDamageComponent]);

        if (playerEntities.length === 0) return;
        const playerPos = entityManager.getComponent(playerEntities[0], PositionComponent);
        const playerCol = entityManager.getComponent(playerEntities[0], CollisionComponent);

        for (const trapId of fireTraps) {
            const trapRender = entityManager.getComponent(trapId, RenderableComponent);
            
            // Skip if not a fire trap
            if (trapRender.spriteKey !== 'fire') continue;

            const trapPos = entityManager.getComponent(trapId, PositionComponent);
            const trapCol = entityManager.getComponent(trapId, CollisionComponent);
            const damageComp = entityManager.getComponent(trapId, PeriodicDamageComponent);
            
            // Check if player is standing on top of the trap base
            const playerBottom = playerPos.y + playerCol.height;
            const trapTop = trapPos.y - trapCol.height / 2;
            const playerIsOnTop = Math.abs(playerBottom - trapTop) < 5 &&
                                  playerPos.x + playerCol.width > trapPos.x - trapCol.width / 2 &&
                                  playerPos.x < trapPos.x + trapCol.width / 2;

            // State machine logic
            const currentState = trapRender.animationState;
            
            if (playerIsOnTop && currentState === 'off') {
                trapRender.animationState = 'hit'; // 'hit' is the activating animation
                trapRender.animationFrame = 0;
                eventBus.publish('playSound', { key: 'fire_activated', volume: 0.8, channel: 'SFX' });
            }

            if (currentState === 'hit' && trapRender.animationFrame >= trapRender.animationConfig.hit.frames -1) {
                trapRender.animationState = 'on';
                trapRender.animationFrame = 0;
            }

            if (currentState === 'on' && !playerIsOnTop) {
                trapRender.animationState = 'off';
            }
            
            // Handle damage dealing
            if (currentState === 'on') {
                damageComp.damageTimer += dt;
                if (damageComp.damageTimer >= damageComp.interval) {
                    damageComp.damageTimer -= damageComp.interval;
                    // Check for overlap with the flame hitbox, which is taller than the base
                    const flameHeight = trapRender.height;
                    const flameY = trapPos.y - flameHeight / 2;
                    if (playerPos.y < flameY + flameHeight && playerPos.y + playerCol.height > flameY) {
                         eventBus.publish('playerTookDamage', { amount: damageComp.amount, source: damageComp.source });
                    }
                }
            } else {
                damageComp.damageTimer = 0;
            }
        }
    }
}