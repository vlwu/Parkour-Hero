import { BaseAI } from './BaseAI.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { ENEMY_STATES, ANIMATION_STATES, DIRECTIONS } from '../utils/constants.js';

export class BatAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        this.anchorX = this.pos.x;
        this.anchorY = this.pos.y;

        this.aggroRadius = this.enemy.ai.aggroRadius || 150;
        this.deaggroRadius = this.enemy.ai.deaggroRadius || 300;
        this.flyingSpeed = this.enemy.ai.flyingSpeed || 20;

        this.state.currentState = ENEMY_STATES.IDLE;
        this.renderable.animationState = ANIMATION_STATES.IDLE;
    }

    update(dt) {
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;

        switch (this.state.currentState) {
            case ENEMY_STATES.IDLE:
                this._updateIdle(playerPos);
                break;
            case ENEMY_STATES.ACTIVATING:
                this._updateActivating();
                break;
            case ENEMY_STATES.FLYING:
                this._updateFlying(dt, playerPos);
                break;
            case ENEMY_STATES.RETURNING:
                this._updateReturning(dt);
                break;
            case ENEMY_STATES.DEACTIVATING:
                this._updateDeactivating();
                break;
        }
    }

    _isPlayerInRange(playerPos) {
        if (!playerPos) return false;

        const dx = playerPos.x - this.pos.x;
        const dy = playerPos.y - this.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);


        return playerPos.y > this.anchorY && distance < this.aggroRadius;
    }

    _updateIdle(playerPos) {
        this.vel.vx = 0;
        this.vel.vy = 0;

        if (this._isPlayerInRange(playerPos)) {
            this.state.currentState = ENEMY_STATES.ACTIVATING;
            this.renderable.animationState = ANIMATION_STATES.CEILING_OUT;
            this.renderable.animationFrame = 0;
            this.renderable.animationTimer = 0;
        }
    }

    _updateActivating() {
        if (this.renderable.animationFrame >= 6) {
            this.state.currentState = ENEMY_STATES.FLYING;
            this.renderable.animationState = ANIMATION_STATES.FLYING;
        }
    }

    _updateFlying(dt, playerPos) {
        if (!playerPos) {
            this.state.currentState = ENEMY_STATES.RETURNING;
            return;
        }

        const dx = playerPos.x - this.pos.x;
        const dy = playerPos.y - this.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.deaggroRadius) {
            this.state.currentState = ENEMY_STATES.RETURNING;
            return;
        }

        if (distance > 1) {
            this.vel.vx = (dx / distance) * this.flyingSpeed;
            this.vel.vy = (dy / distance) * this.flyingSpeed;
        } else {
            this.vel.vx = 0;
            this.vel.vy = 0;
        }
        this.renderable.direction = this.vel.vx >= 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
    }

    _updateReturning(dt) {
        const dx = this.anchorX - this.pos.x;
        const dy = this.anchorY - this.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            this.vel.vx = (dx / distance) * this.flyingSpeed * 2;
            this.vel.vy = (dy / distance) * this.flyingSpeed * 2;
        } else {
            this.pos.x = this.anchorX;
            this.pos.y = this.anchorY;
            this.vel.vx = 0;
            this.vel.vy = 0;
            this.state.currentState = ENEMY_STATES.DEACTIVATING;
            this.renderable.animationState = ANIMATION_STATES.CEILING_IN;
            this.renderable.animationFrame = 0;
            this.renderable.animationTimer = 0;
        }
         this.renderable.direction = this.vel.vx >= 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
    }

    _updateDeactivating() {
        if (this.renderable.animationFrame >= 6) {
            this.state.currentState = ENEMY_STATES.IDLE;
            this.renderable.animationState = ANIMATION_STATES.IDLE;
        }
    }
}