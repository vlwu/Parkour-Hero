import { BaseAI } from './BaseAI.js';
import { GroundPatrol } from './GroundPatrol.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { KillableComponent } from '../components/KillableComponent.js';
import { ENEMY_STATES, ANIMATION_STATES, DIRECTIONS } from '../utils/constants.js';
import { RageStateComponent } from '../components/RageStateComponent.js';

export class AngryPigAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);
        this.groundPatrol = new GroundPatrol(entityId, entityManager, level, playerEntityId);
        this.groundPatrol.patrolSpeed = this.enemy.ai.walkSpeed;
        this.groundPatrol.idleTime = this.enemy.ai.idleTime;
    }

    update(dt) {
        const rage = this.entityManager.getComponent(this.entityId, RageStateComponent);
        if (!rage) return;

        if (rage.isTransitioning) {
            this._updateTransitioningAI(dt, rage);
        } else if (rage.isRaging) {
            this._updateRagingAI(dt);
        } else {
            this._updateWalkingAI(dt);
        }
    }

    _updateWalkingAI(dt) {
        this.groundPatrol.update(dt);
        this.renderable.animationState = this.state.currentState === ENEMY_STATES.PATROL ? ANIMATION_STATES.WALK : ANIMATION_STATES.IDLE;
    }

    _updateTransitioningAI(dt, rage) {
        this.vel.vx = 0;
        const hitAnim = ENEMY_DEFINITIONS.angrypig.animations.hit1;
        if (this.renderable.animationFrame >= hitAnim.frameCount - 1) {
            rage.isTransitioning = false;
            rage.isRaging = true;
            this.state.currentState = ENEMY_STATES.PATROL;
            const killable = this.entityManager.getComponent(this.entityId, KillableComponent);
            if (killable) {
                killable.stompable = true;
            }
        }
    }

    _updateRagingAI(dt) {
        this.state.currentState = ENEMY_STATES.PATROL;
        this.renderable.animationState = ANIMATION_STATES.RUN;
        this.vel.vx = this.renderable.direction === DIRECTIONS.RIGHT ? this.enemy.ai.runSpeed : -this.enemy.ai.runSpeed;

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
        }
    }
}