import { BaseAI } from './BaseAI.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { ENEMY_STATES, ANIMATION_STATES, DIRECTIONS } from '../utils/constants.js';

export class GroundChargeAI extends BaseAI {
    update(dt) {
        const ai = this.enemy.ai;
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        const playerCol = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, CollisionComponent) : null;
        const playerData = playerPos && playerCol ? { ...playerPos, ...playerCol } : null;

        switch (this.state.currentState) {
            case ENEMY_STATES.IDLE:
                this.vel.vx = 0;
                this.renderable.animationState = ANIMATION_STATES.IDLE;

                if (this.col.isGrounded) {
                    const edges = this._findPlatformEdges();
                    if (edges) {
                        const platformCenter = edges.left + (edges.right - edges.left) / 2;
                        this.renderable.direction = (this.pos.x + this.col.width / 2 < platformCenter) ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
                    }
                }

                if (playerData) {
                    const enemyEdges = this._getPlatformEdgesForEntity(this.pos, this.col);
                    const playerEdges = this._getPlatformEdgesForEntity(playerPos, playerCol);

                    const onSamePlatform = enemyEdges && playerEdges && enemyEdges.left === playerEdges.left && enemyEdges.right === playerEdges.right;

                    const verticalDistance = Math.abs((playerData.y + playerData.height / 2) - (this.pos.y + this.col.height / 2));
                    const onSameLevel = verticalDistance < this.col.height * 1.5;
                    const horizontalDistance = Math.abs((playerData.x + playerData.width / 2) - (this.pos.x + this.col.width / 2));
                    const inRange = horizontalDistance <= ai.aggroRange;

                    if (onSamePlatform && onSameLevel && inRange) {
                        const isPlayerRight = (playerData.x + playerData.width / 2) > (this.pos.x + this.col.width / 2);
                        const chargeDirection = isPlayerRight ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;

                        let hasRoomToCharge = true;
                        if (enemyEdges) {
                            if (chargeDirection === DIRECTIONS.RIGHT && (this.pos.x + this.col.width) >= enemyEdges.right - 1) {
                                hasRoomToCharge = false;
                            }
                            if (chargeDirection === DIRECTIONS.LEFT && this.pos.x <= enemyEdges.left + 1) {
                                hasRoomToCharge = false;
                            }
                        }

                        if (hasRoomToCharge) {
                            this.renderable.direction = chargeDirection;
                            this.state.currentState = ENEMY_STATES.CHARGING;
                            this.vel.vx = (this.renderable.direction === DIRECTIONS.RIGHT ? 1 : -1) * ai.chargeSpeed;
                        }
                    }
                }
                break;

            case ENEMY_STATES.CHARGING:
                this.renderable.animationState = ANIMATION_STATES.RUN;
                this.vel.vx = (this.renderable.direction === DIRECTIONS.RIGHT ? 1 : -1) * ai.chargeSpeed;

                const edges = this._findPlatformEdges();
                let atEdge = false;
                if (edges) {
                    if (this.vel.vx > 0 && (this.pos.x + this.col.width) >= edges.right) { atEdge = true; this.pos.x = edges.right - this.col.width; }
                    else if (this.vel.vx < 0 && this.pos.x <= edges.left) { atEdge = true; this.pos.x = edges.left; }
                } else { atEdge = true; }

                if (atEdge) {
                    this.state.currentState = ENEMY_STATES.COOLDOWN;
                    this.vel.vx = 0;
                    this.enemy.timer = ai.cooldownTime;
                }
                break;

            case ENEMY_STATES.COOLDOWN:
                this.vel.vx = 0;
                this.renderable.animationState = ANIMATION_STATES.IDLE;
                this.enemy.timer -= dt;
                if (this.enemy.timer <= 0) {
                    this.state.currentState = ENEMY_STATES.IDLE;
                }
                break;
        }
    }
}