import { eventBus } from '../utils/event-bus.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { PLAYER_CONSTANTS, TRAP_CONSTANTS } from '../utils/constants.js';

export class GameplaySystem {
    constructor() {
        this.collisionEvents = [];
        this.hardLandings = [];
        
        eventBus.subscribe('collisionEvent', (e) => this.collisionEvents.push(e));
        eventBus.subscribe('playerLandedHard', (e) => this.hardLandings.push(e));
    }

    handlePlayerLandedHard({ entityId, landingVelocity }, entityManager) {
        const { FALL_DAMAGE_MIN_VELOCITY, FALL_DAMAGE_MAX_VELOCITY, FALL_DAMAGE_MIN_AMOUNT, FALL_DAMAGE_MAX_AMOUNT } = PLAYER_CONSTANTS;
        const clampedVelocity = Math.max(FALL_DAMAGE_MIN_VELOCITY, Math.min(landingVelocity, FALL_DAMAGE_MAX_VELOCITY));
        const progress = (clampedVelocity - FALL_DAMAGE_MIN_VELOCITY) / (FALL_DAMAGE_MAX_VELOCITY - FALL_DAMAGE_MIN_VELOCITY);
        const damage = Math.round(FALL_DAMAGE_MIN_AMOUNT + progress * (FALL_DAMAGE_MAX_AMOUNT - FALL_DAMAGE_MIN_AMOUNT));

        eventBus.publish('playerTookDamage', { amount: damage, source: 'fall' });
    }

    handleCollision({ type, entityId, target, damage, knockback }, entityManager) {
        const isPlayer = !!entityManager.getComponent(entityId, PlayerControlledComponent);
        if (!isPlayer) return;

        switch (type) {
            case 'fruit':
                eventBus.publish('fruitCollected', target);
                break;
            case 'world_bottom':
                eventBus.publish('playerDied');
                break;
            case 'hazard':
                const hazardDamage = damage !== undefined ? damage : TRAP_CONSTANTS.DEFAULT_HAZARD_DAMAGE;

                if (hazardDamage > 0) {
                    eventBus.publish('playerTookDamage', { amount: hazardDamage, source: 'hazard' });
                }

                if (knockback) {
                    eventBus.publish('playerKnockback', {
                        entityId,
                        vx: knockback.vx,
                        vy: knockback.vy
                    });
                }
                break;
            case 'checkpoint':
                eventBus.publish('checkpointActivated', target);
                break;
        }
    }

    update(dt, { entityManager }) {
        for (const e of this.hardLandings) {
            this.handlePlayerLandedHard(e, entityManager);
        }
        this.hardLandings = [];

        for (const e of this.collisionEvents) {
            this.handleCollision(e, entityManager);
        }
        this.collisionEvents = [];
    }
}