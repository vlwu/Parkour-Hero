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

        const nextX = this.pos.x + this.vel.vx * dt;
        const nextY = this.pos.y + this.vel.vy * dt;

        let bounced = false;

        // Horizontal collision
        const wallProbeX = this.vel.vx > 0 ? nextX + this.col.width : nextX;
        if (this.level.isSolidAt(wallProbeX, this.pos.y + this.col.height / 2, true)) {
            this.vel.vx *= -1;
            bounced = true;
        }

        // Vertical collision
        const groundProbeY = this.vel.vy > 0 ? nextY + this.col.height : nextY;
        if (this.level.isSolidAt(this.pos.x + this.col.width / 2, groundProbeY, true)) {
            this.vel.vy *= -1;
            bounced = true;
        }

        if (bounced) {
            if (this.enemy.skullState === ENEMY_STATES.IDLE2) {
                this.state.currentState = 'hit_wall_1';
            } else {
                this.state.currentState = 'hit_wall_2';
            }
            this.renderable.animationState = this.state.currentState;
            this.renderable.animationFrame = 0;
            this.renderable.animationTimer = 0;
            this.vel.vx = Math.sign(this.vel.vx) * this.bounceSpeed;
            this.vel.vy = Math.sign(this.vel.vy) * this.bounceSpeed;
        }
    }

    _updateVulnerability() {
        const killable = this.entityManager.getComponent(this.entityId, KillableComponent);
        if (!killable) return;

        if (this.enemy.skullState === ENEMY_STATES.IDLE1) {
            killable.stompable = true;
            killable.dealsContactDamage = false;
        } else { // IDLE2
            killable.stompable = false;
            killable.dealsContactDamage = true;
        }
    }
}