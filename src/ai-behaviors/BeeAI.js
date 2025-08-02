import { BaseAI } from './BaseAI.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { ENEMY_STATES, ANIMATION_STATES, EVENTS, DIRECTIONS } from '../utils/constants.js';

export class BeeAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        this.patrolBoxSize = this.enemy.ai.patrolBoxSize || 150;
        this.airSpeed = this.enemy.ai.airSpeed || 50;
        this.attackInterval = this.enemy.ai.attackInterval || 2.0;
        this.soundRadius = this.enemy.ai.soundRadius || 200;

        this.anchorX = this.pos.x + this.col.width / 2;
        this.anchorY = this.pos.y + this.col.height / 2;
        this.targetX = this.anchorX;
        this.targetY = this.anchorY;
        this.moveTimer = 0;
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

        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.targetX = this.anchorX + (Math.random() - 0.5) * this.patrolBoxSize;
            this.targetY = this.anchorY + (Math.random() - 0.5) * this.patrolBoxSize;
            this.moveTimer = Math.random() * 2 + 1;
        }

        const dx = this.targetX - (this.pos.x + this.col.width / 2);
        const dy = this.targetY - (this.pos.y + this.col.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            this.vel.vx = (dx / dist) * this.airSpeed;
            this.vel.vy = (dy / dist) * this.airSpeed;
        } else {
            this.vel.vx = 0;
            this.vel.vy = 0;
        }

        if (Math.abs(this.vel.vx) > 0.1) {
            this.renderable.direction = this.vel.vx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
        }
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