import { BaseAI } from './BaseAI.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_STATES, ANIMATION_STATES, DIRECTIONS, EVENTS } from '../utils/constants.js';
import { ShellComponent } from '../components/ShellComponent.js';

export class SnailAI extends BaseAI {
    update(dt) {
        const shell = this.entityManager.getComponent(this.entityId, ShellComponent);
        if (shell && shell.isActive) {
            this._updateShellAI(dt);
        } else {
            this._updateWalkingAI(dt);
        }
    }

    _updateWalkingAI(dt) {
        const speed = this.enemy.ai.patrolSpeed;
        this.state.currentState = ENEMY_STATES.PATROL;
        this.renderable.animationState = ANIMATION_STATES.WALK;
        this.vel.vx = this.renderable.direction === DIRECTIONS.RIGHT ? speed : -speed;

        const groundProbeX = this.renderable.direction === DIRECTIONS.RIGHT ? this.pos.x + this.col.width : this.pos.x;
        const groundProbeY = this.pos.y + this.col.height + 1;
        const isGroundSolidAhead = this.level.isSolidAt(groundProbeX, groundProbeY, true);
        const atEdge = !isGroundSolidAhead;

        const wallProbeX = this.renderable.direction === DIRECTIONS.RIGHT ? this.pos.x + this.col.width + 1 : this.pos.x - 1;
        const wallProbeY = this.pos.y + this.col.height / 2;
        const hitWall = this.level.isSolidAt(wallProbeX, wallProbeY, true);

        if (atEdge || hitWall) {
            this.renderable.direction = (this.renderable.direction === DIRECTIONS.RIGHT ? DIRECTIONS.LEFT : DIRECTIONS.RIGHT);
        }
    }

    _updateShellAI(dt) {
        const speed = this.enemy.ai.shellSpeed;

        switch (this.state.currentState) {
            case ENEMY_STATES.SHELL_PATROL:
                this.renderable.animationState = ANIMATION_STATES.SHELL_IDLE;
                this.vel.vx = this.renderable.direction === DIRECTIONS.RIGHT ? speed : -speed;

                const wallProbeX = this.renderable.direction === DIRECTIONS.RIGHT ? this.pos.x + this.col.width + 1 : this.pos.x - 1;
                const wallProbeY = this.pos.y + this.col.height / 2;
                const hitWall = this.level.isSolidAt(wallProbeX, wallProbeY, true);

                if (hitWall) {
                    this.renderable.direction = (this.renderable.direction === DIRECTIONS.RIGHT ? DIRECTIONS.LEFT : DIRECTIONS.RIGHT);
                    this.state.currentState = ENEMY_STATES.SHELL_HIT_WALL;
                    this.renderable.animationState = ANIMATION_STATES.SHELL_WALL_HIT;
                    this.renderable.animationFrame = 0;
                    this.enemy.timer = this.enemy.ai.wallHitStunTime || 0.2;
                    eventBus.publish(EVENTS.PLAY_SOUND, { key: 'snail_wall_hit', volume: 0.5, channel: 'SFX' });
                }
                break;

            case ENEMY_STATES.SHELL_HIT_WALL:
                this.vel.vx = 0;
                this.enemy.timer -= dt;
                if (this.enemy.timer <= 0) {
                    this.state.currentState = ENEMY_STATES.SHELL_PATROL;
                }
                break;
        }
    }
}