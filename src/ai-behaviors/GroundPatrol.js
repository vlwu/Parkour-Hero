import { BaseAI } from './BaseAI.js';
import { ENEMY_STATES, DIRECTIONS } from '../utils/constants.js';

export class GroundPatrol extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);
        this.patrolSpeed = this.enemy.ai.patrolSpeed || 40;
        this.idleTime = this.enemy.ai.idleTime || 0.5;
    }

    update(dt) {
        switch (this.state.currentState) {
            case ENEMY_STATES.IDLE:
            case ENEMY_STATES.IDLE_GROUNDED:
                this.vel.vx = 0;
                this.enemy.timer -= dt;
                if (this.enemy.timer <= 0) {
                    this.state.currentState = this.state.currentState === ENEMY_STATES.IDLE ? ENEMY_STATES.PATROL : ENEMY_STATES.PATROL_GROUNDED;
                }
                break;

            case ENEMY_STATES.PATROL:
            case ENEMY_STATES.PATROL_GROUNDED:
                this.vel.vx = this.renderable.direction === DIRECTIONS.RIGHT ? this.patrolSpeed : -this.patrolSpeed;

                const groundProbeX = this.renderable.direction === DIRECTIONS.RIGHT
                    ? this.pos.x + this.col.width
                    : this.pos.x;
                const groundProbeY = this.pos.y + this.col.height + 1;
                const isGroundSolidAhead = this.level.isSolidAt(groundProbeX, groundProbeY, true);
                const atEdge = !isGroundSolidAhead;

                const wallProbeX = this.renderable.direction === DIRECTIONS.RIGHT
                    ? this.pos.x + this.col.width + 1
                    : this.pos.x - 1;
                const wallProbeY = this.pos.y + this.col.height / 2;
                const hitWall = this.level.isSolidAt(wallProbeX, wallProbeY, true);

                if (atEdge || hitWall) {
                    this.renderable.direction = (this.renderable.direction === DIRECTIONS.RIGHT ? DIRECTIONS.LEFT : DIRECTIONS.RIGHT);
                    this.state.currentState = this.state.currentState === ENEMY_STATES.PATROL ? ENEMY_STATES.IDLE : ENEMY_STATES.IDLE_GROUNDED;
                    this.enemy.timer = this.idleTime;
                }
                break;
        }
    }
}