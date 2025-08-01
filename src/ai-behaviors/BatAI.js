import { BaseAI } from './BaseAI.js';
import { PositionComponent } from '../components/PositionComponent.js';

export class BatAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        this.anchorX = this.pos.x;
        this.anchorY = this.pos.y;

        this.aggroRadius = this.enemy.ai.aggroRadius || 150;
        this.deaggroRadius = this.enemy.ai.deaggroRadius || 300;
        this.flyingSpeed = this.enemy.ai.flyingSpeed || 20;

        this.state.currentState = 'idle';
        this.renderable.animationState = 'idle';
    }

    update(dt) {
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;

        switch (this.state.currentState) {
            case 'idle':
                this._updateIdle(playerPos);
                break;
            case 'activating':
                this._updateActivating();
                break;
            case 'flying':
                this._updateFlying(dt, playerPos);
                break;
            case 'returning':
                this._updateReturning(dt);
                break;
            case 'deactivating':
                this._updateDeactivating();
                break;
        }
    }

    _isPlayerInRange(playerPos) {
        if (!playerPos) return false;

        const dx = playerPos.x - this.pos.x;
        const dy = playerPos.y - this.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Player must be below the bat and within aggro range
        return playerPos.y > this.anchorY && distance < this.aggroRadius;
    }

    _updateIdle(playerPos) {
        this.vel.vx = 0;
        this.vel.vy = 0;

        if (this._isPlayerInRange(playerPos)) {
            this.state.currentState = 'activating';
            this.renderable.animationState = 'ceiling_out';
            this.renderable.animationFrame = 0;
            this.renderable.animationTimer = 0;
        }
    }

    _updateActivating() {
        if (this.renderable.animationFrame >= 6) { // 7 frames, 0-indexed
            this.state.currentState = 'flying';
            this.renderable.animationState = 'flying';
        }
    }

    _updateFlying(dt, playerPos) {
        if (!playerPos) {
            this.state.currentState = 'returning';
            return;
        }

        const dx = playerPos.x - this.pos.x;
        const dy = playerPos.y - this.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.deaggroRadius) {
            this.state.currentState = 'returning';
            return;
        }

        if (distance > 1) {
            this.vel.vx = (dx / distance) * this.flyingSpeed;
            this.vel.vy = (dy / distance) * this.flyingSpeed;
        } else {
            this.vel.vx = 0;
            this.vel.vy = 0;
        }
        this.renderable.direction = this.vel.vx >= 0 ? 'right' : 'left';
    }

    _updateReturning(dt) {
        const dx = this.anchorX - this.pos.x;
        const dy = this.anchorY - this.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            this.vel.vx = (dx / distance) * this.flyingSpeed * 2; // Return faster
            this.vel.vy = (dy / distance) * this.flyingSpeed * 2;
        } else {
            this.pos.x = this.anchorX;
            this.pos.y = this.anchorY;
            this.vel.vx = 0;
            this.vel.vy = 0;
            this.state.currentState = 'deactivating';
            this.renderable.animationState = 'ceiling_in';
            this.renderable.animationFrame = 0;
            this.renderable.animationTimer = 0;
        }
         this.renderable.direction = this.vel.vx >= 0 ? 'right' : 'left';
    }

    _updateDeactivating() {
        if (this.renderable.animationFrame >= 6) {
            this.state.currentState = 'idle';
            this.renderable.animationState = 'idle';
        }
    }
}