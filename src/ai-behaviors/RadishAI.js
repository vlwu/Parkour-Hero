import { BaseAI } from './BaseAI.js';

export class RadishAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        // From enemy definition
        this.patrolBoxSize = this.enemy.ai.patrolBoxSize || 150;
        this.airSpeed = this.enemy.ai.airSpeed || 50;
        this.groundSpeed = this.enemy.ai.groundSpeed || 80;
        this.idleTime = this.enemy.ai.idleTime || 1.0;

        // Internal state
        this.anchorX = this.pos.x + this.col.width / 2;
        this.anchorY = this.pos.y + this.col.height / 2;
        this.targetX = this.anchorX;
        this.targetY = this.anchorY;
        this.moveTimer = 0;

        if (!this.enemy.radishState) {
            this.enemy.radishState = 'flying';
        }
    }

    update(dt) {
        if (this.enemy.radishState === 'flying') {
            this._updateFlying(dt);
        } else if (this.enemy.radishState === 'falling') {
            this._updateFalling(dt);
        } else if (this.enemy.radishState === 'grounded') {
            this._updateGrounded(dt);
        }
    }

    _updateFlying(dt) {
        this.renderable.animationState = 'idle1';
        this.state.currentState = 'flying';

        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            // Pick a new target point within the box
            this.targetX = this.anchorX + (Math.random() - 0.5) * this.patrolBoxSize;
            this.targetY = this.anchorY + (Math.random() - 0.5) * this.patrolBoxSize;
            this.moveTimer = Math.random() * 2 + 1; // Move for 1-3 seconds
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
            this.renderable.direction = this.vel.vx > 0 ? 'right' : 'left';
        }
    }

    _updateFalling(dt) {
        this.renderable.animationState = 'idle1';
        this.state.currentState = 'falling';
        this.vel.vx = 0;
        this.vel.vy += 600 * dt; 

        if (this.col.isGrounded) {
            this.enemy.radishState = 'grounded';
            this.state.currentState = 'idle_grounded';
            this.renderable.animationState = 'idle2';
            this.renderable.animationFrame = 0;
            this.vel.vy = 0;
            this.enemy.timer = this.idleTime;
        }
    }

    _updateGrounded(dt) {
        switch (this.state.currentState) {
            case 'idle_grounded':
                this.renderable.animationState = 'idle2';
                this.vel.vx = 0;
                this.enemy.timer -= dt;
                if (this.enemy.timer <= 0) {
                    this.state.currentState = 'patrol_grounded';
                }
                break;

            case 'patrol_grounded':
                this.renderable.animationState = 'run';
                this.vel.vx = this.renderable.direction === 'right' ? this.groundSpeed : -this.groundSpeed;

                const groundProbeX = this.renderable.direction === 'right'
                    ? this.pos.x + this.col.width
                    : this.pos.x;
                const groundProbeY = this.pos.y + this.col.height + 1;
                const isGroundSolidAhead = this.level.isSolidAt(groundProbeX, groundProbeY, true);
                const atEdge = !isGroundSolidAhead;

                const wallProbeX = this.renderable.direction === 'right'
                    ? this.pos.x + this.col.width + 1
                    : this.pos.x - 1;
                const wallProbeY = this.pos.y + this.col.height / 2;
                const hitWall = this.level.isSolidAt(wallProbeX, wallProbeY, true);

                if (atEdge || hitWall) {
                    this.renderable.direction = (this.renderable.direction === 'right' ? 'left' : 'right');
                    this.state.currentState = 'idle_grounded';
                    this.enemy.timer = this.idleTime;
                }
                break;
        }
    }
}