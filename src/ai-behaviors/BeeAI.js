import { BaseAI } from './BaseAI.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { BoxPatrol } from './BoxPatrol.js';
import { ENEMY_STATES, ANIMATION_STATES, EVENTS, DIRECTIONS } from '../utils/constants.js';

export class BeeAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        this.boxPatrol = new BoxPatrol(entityId, entityManager, level, playerEntityId);

        this.attackInterval = this.enemy.ai.attackInterval || 2.0;
        this.soundRadius = this.enemy.ai.soundRadius || 200;

        this.attackTimer = this.attackInterval;
        this.hasFired = false;


        this.state.currentState = ENEMY_STATES.FLYING;
    }

    update(dt) {
        switch (this.state.currentState) {
            case ENEMY_STATES.FLYING:
                this._updateFlying(dt);
                break;
            case ENEMY_STATES.ATTACKING:
                this._updateAttacking(dt);
                break;
        }
    }

    _updateFlying(dt) {
        this.renderable.animationState = ANIMATION_STATES.IDLE;

        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
            this.state.currentState = ENEMY_STATES.ATTACKING;
            this.renderable.animationState = ANIMATION_STATES.ATTACK;
            this.renderable.animationFrame = 0;
            this.renderable.animationTimer = 0;
            this.hasFired = false;
            return;
        }

        this.boxPatrol.update(dt);
    }

    _updateAttacking(dt) {
        this.vel.vx = 0;
        this.vel.vy = 0;

        const attackAnim = ENEMY_DEFINITIONS.bee.animations.attack;
        const fireFrame = attackAnim.fireFrame || 4;

        if (this.renderable.animationFrame >= fireFrame && !this.hasFired) {
            this.hasFired = true;
            eventBus.publish(EVENTS.SPAWN_BULLET, {
                x: this.pos.x + this.col.width / 2,
                y: this.pos.y + this.col.height,
                config: this.enemy.ai.bullet,
                spriteKey: 'bee_bullet',
                piecesSpriteKey: 'bee_bullet_pieces'
            });

            const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
            if (playerPos) {
                const distance = Math.sqrt(Math.pow(playerPos.x - this.pos.x, 2) + Math.pow(playerPos.y - this.pos.y, 2));
                if (distance < this.soundRadius) {
                    eventBus.publish(EVENTS.PLAY_SOUND, { key: 'bullet_shoot', volume: 0.5, channel: 'SFX' });
                }
            }
        }

        const animTimer = this.renderable.animationTimer + dt;
        if (this.renderable.animationFrame >= attackAnim.frameCount - 1 && animTimer >= attackAnim.speed) {
             this.state.currentState = ENEMY_STATES.FLYING;
             this.attackTimer = this.attackInterval;
        }
    }
}