import { BaseAI } from './BaseAI.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';

export class GroundChargeAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);
        this.patrolEdges = this._findPlatformEdges();
    }

    update(dt) {
        this.lastPlatformCheckTime += dt;
        if (this.lastPlatformCheckTime >= this.platformCheckInterval) {
            this.lastPlatformCheckTime = 0;
            const newEdges = this._findPlatformEdges();
            if (newEdges) {
                this.patrolEdges = newEdges;
            }
        }
        const edges = this.patrolEdges;

        const ai = this.enemy.ai;
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        const playerCol = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, CollisionComponent) : null;
        const playerData = playerPos && playerCol ? { ...playerPos, ...playerCol } : null;

        switch (this.state.currentState) {
            case 'idle':
                this.vel.vx = 0;
                this.renderable.animationState = 'idle';

                if (this.col.isGrounded && edges) {
                    const platformCenter = edges.left + (edges.right - edges.left) / 2;
                    this.renderable.direction = (this.pos.x + this.col.width / 2 < platformCenter) ? 'right' : 'left';
                }

                if (playerData) {
                    const verticalDistance = Math.abs((playerData.y + playerData.height / 2) - (this.pos.y + this.col.height / 2));
                    const onSameLevel = verticalDistance < this.col.height * 1.5;
                    const horizontalDistance = Math.abs((playerData.x + playerData.width / 2) - (this.pos.x + this.col.width / 2));
                    const inRange = horizontalDistance <= ai.aggroRange;

                    if (onSameLevel && inRange) {
                        const isPlayerRight = (playerData.x + playerData.width / 2) > (this.pos.x + this.col.width / 2);
                        const chargeDirection = isPlayerRight ? 'right' : 'left';
                        
                        let hasRoomToCharge = true;
                        if (edges) {
                            if (chargeDirection === 'right' && (this.pos.x + this.col.width) >= edges.right - 1) {
                                hasRoomToCharge = false;
                            }
                            if (chargeDirection === 'left' && this.pos.x <= edges.left + 1) {
                                hasRoomToCharge = false;
                            }
                        }

                        if (hasRoomToCharge) {
                            this.renderable.direction = chargeDirection;
                            this.state.currentState = 'warning';
                            this.enemy.timer = ai.idleTime;
                        }
                    }
                }
                break;

            case 'warning':
                this.vel.vx = 0;
                this.renderable.animationState = 'idle';
                this.enemy.timer -= dt;
                if (this.enemy.timer <= 0) {
                    this.state.currentState = 'charging';
                    this.vel.vx = (this.renderable.direction === 'right' ? 1 : -1) * ai.chargeSpeed;
                }
                break;

            case 'charging':
                this.renderable.animationState = 'run';
                this.vel.vx = (this.renderable.direction === 'right' ? 1 : -1) * ai.chargeSpeed;
                
                let atEdge = false;
                if (edges) {
                    if (this.vel.vx > 0 && (this.pos.x + this.col.width) >= edges.right) { atEdge = true; this.pos.x = edges.right - this.col.width; }
                    else if (this.vel.vx < 0 && this.pos.x <= edges.left) { atEdge = true; this.pos.x = edges.left; }
                } else { atEdge = true; }

                if (atEdge) {
                    this.state.currentState = 'cooldown';
                    this.vel.vx = 0;
                    this.enemy.timer = ai.cooldownTime;
                }
                break;

            case 'cooldown':
                this.vel.vx = 0;
                this.renderable.animationState = 'idle';
                this.enemy.timer -= dt;
                if (this.enemy.timer <= 0) {
                    this.state.currentState = 'idle';
                }
                break;
        }
    }
}