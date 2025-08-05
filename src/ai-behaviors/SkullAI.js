import { BaseAI } from './BaseAI.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { ENEMY_STATES, ANIMATION_STATES, DIRECTIONS } from '../utils/constants.js';
import { KillableComponent } from '../components/KillableComponent.js';

export class SkullAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        this.bounceSpeed = this.enemy.ai.bounceSpeed || 120;
        this.enemy.skullState = ENEMY_STATES.IDLE2;
        this.state.currentState = ENEMY_STATES.IDLE2;
        this.vel.vx = this.bounceSpeed * (Math.random() > 0.5 ? 1 : -1);
        this.vel.vy = this.bounceSpeed * (Math.random() > 0.5 ? 1 : -1);
        this._updateVulnerability();
    }

    update(dt) {
        if (this.state.currentState === 'hit_wall_1' || this.state.currentState === 'hit_wall_2') {
            const anim = ENEMY_DEFINITIONS.skull.animations[this.state.currentState];
            if (this.renderable.animationFrame >= anim.frameCount - 1) {
                if (this.state.currentState === 'hit_wall_1') {
                    this.enemy.skullState = ENEMY_STATES.IDLE1;
                    this.state.currentState = ENEMY_STATES.IDLE1;
                } else {
                    this.enemy.skullState = ENEMY_STATES.IDLE2;
                    this.state.currentState = ENEMY_STATES.IDLE2;
                }
                this._updateVulnerability();
            }
            return;
        }

        this.renderable.animationState = this.state.currentState;

        if (this.vel.vx > 0) {
            this.renderable.direction = DIRECTIONS.RIGHT;
        } else if (this.vel.vx < 0) {
            this.renderable.direction = DIRECTIONS.LEFT;
        }

        const nextX = this.pos.x + this.vel.vx * dt;
        const nextY = this.pos.y + this.vel.vy * dt;

        let bouncedX = false;
        let bouncedY = false;

        // Wall probe
        const wallProbeX = this.vel.vx > 0 ? nextX + this.col.width : nextX;
        if (this.level.isSolidAt(wallProbeX, this.pos.y + this.col.height / 2, true)) {
            bouncedX = true;
        }

        // Ground probe
        const groundProbeY = this.vel.vy > 0 ? nextY + this.col.height : nextY;
        if (this.level.isSolidAt(this.pos.x + this.col.width / 2, groundProbeY, true)) {
            bouncedY = true;
        }
        
        // Corner probe to handle cases where single probes might fail
        if (!bouncedX && !bouncedY && this.level.isSolidAt(wallProbeX, groundProbeY, true)) {
            bouncedX = true;
            bouncedY = true;
        }

        const bounced = bouncedX || bouncedY;

        if (bounced) {
            if (this.enemy.skullState === ENEMY_STATES.IDLE1) {
                this.state.currentState = 'hit_wall_2';
            } else {
                this.state.currentState = 'hit_wall_1';
            }
            this.renderable.animationState = this.state.currentState;
            this.renderable.animationFrame = 0;
            this.renderable.animationTimer = 0;

            // Invert velocity based on which surface was hit
            if (bouncedX) this.vel.vx *= -1;
            if (bouncedY) this.vel.vy *= -1;

            // Add some randomness to the bounce angle to prevent getting stuck in loops
            let angle = Math.atan2(this.vel.vy, this.vel.vx);
            angle += (Math.random() - 0.5) * 0.5; // Randomize by approx. +/- 14 degrees
            
            this.vel.vx = Math.cos(angle) * this.bounceSpeed;
            this.vel.vy = Math.sin(angle) * this.bounceSpeed;
        }
    }

    _updateVulnerability() {
        const killable = this.entityManager.getComponent(this.entityId, KillableComponent);
        if (!killable) return;

        if (this.enemy.skullState === ENEMY_STATES.IDLE1) {
            killable.stompable = true;
            killable.dealsContactDamage = false;
        } else {
            killable.stompable = false;
            killable.dealsContactDamage = true;
        }
    }
}