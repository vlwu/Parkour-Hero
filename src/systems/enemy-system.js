import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { StateComponent } from '../components/StateComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { KillableComponent } from '../components/KillableComponent.js';
import { GRID_CONSTANTS } from '../utils/constants.js';

export class EnemySystem {
    constructor() {
        this.stompEvents = [];
        eventBus.subscribe('enemyStomped', (e) => this.stompEvents.push(e));
    }

    _processStompEvents(entityManager) {
        if (this.stompEvents.length === 0) return;
        for (const event of this.stompEvents) {
            const { enemyId } = event;
            const enemy = entityManager.getComponent(enemyId, EnemyComponent);
            const state = entityManager.getComponent(enemyId, StateComponent);
            const renderable = entityManager.getComponent(enemyId, RenderableComponent);
            const collision = entityManager.getComponent(enemyId, CollisionComponent);
            const killable = entityManager.getComponent(enemyId, KillableComponent);

            if (enemy && !enemy.isDead) {
                if (killable && !killable.stompable) {
                    eventBus.publish('playSound', { key: 'hit', volume: 0.9, channel: 'SFX' });
                    continue;
                }
                enemy.isDead = true;
                state.currentState = 'dying';
                renderable.animationState = 'hit';
                renderable.animationFrame = 0;
                renderable.animationTimer = 0;
                collision.solid = false;
                enemy.deathTimer = 0.5;
                eventBus.publish('playSound', { key: 'enemy_stomp', volume: 0.9, channel: 'SFX' });
            }
        }
        this.stompEvents = [];
    }

    update(dt, { entityManager, playerEntityId, playerCol, level }) {
        this._processStompEvents(entityManager);
        const enemyEntities = entityManager.query([EnemyComponent, PositionComponent, VelocityComponent, StateComponent, RenderableComponent]);
        const playerData = playerEntityId && playerCol ? { ...entityManager.getComponent(playerEntityId, PositionComponent), ...playerCol } : null;
        for (const id of enemyEntities) {
            const enemy = entityManager.getComponent(id, EnemyComponent);
            const pos = entityManager.getComponent(id, PositionComponent);
            const vel = entityManager.getComponent(id, VelocityComponent);
            const state = entityManager.getComponent(id, StateComponent);
            const renderable = entityManager.getComponent(id, RenderableComponent);
            const col = entityManager.getComponent(id, CollisionComponent);
            if (enemy.isDead) {
                const wasDestroyed = this._updateDyingState(dt, enemy, vel, entityManager, id);
                if (wasDestroyed) { continue; }
            } else {
                switch (enemy.ai.type) {
                    case 'patrol': this._updatePatrolAI(dt, pos, vel, enemy, renderable, state); break;
                    case 'ground_charge': this._updateGroundChargeAI(dt, pos, vel, enemy, renderable, state, playerData, col, level); break;
                    case 'defensive_cycle': this._updateDefensiveCycleAI(dt, vel, enemy, renderable, state); break;
                    case 'hop': this._updateHopAI(dt, vel, enemy, renderable, state, entityManager.getComponent(id, CollisionComponent)); break;
                }
            }
            this._updateAnimation(dt, id, entityManager);
        }
    }

    _findPlatformEdges(pos, col, level) {
        if (!level) return null;

        const TILE_SIZE = GRID_CONSTANTS.TILE_SIZE;
        const checkY = Math.floor((pos.y + col.height + 1) / TILE_SIZE);

        if (checkY >= level.gridHeight || checkY < 0) return null;

        const startGridX = Math.floor((pos.x + col.width / 2) / TILE_SIZE);

        const initialTile = level.getTileAt(startGridX * TILE_SIZE, checkY * TILE_SIZE);
        if(!initialTile || !initialTile.solid || initialTile.oneWay) {
            return null;
        }

        let leftGridX = startGridX;
        while(leftGridX > 0) {
            const tile = level.getTileAt((leftGridX - 1) * TILE_SIZE, checkY * TILE_SIZE);
            if (!tile || !tile.solid || tile.oneWay) break;
            leftGridX--;
        }

        let rightGridX = startGridX;
        while(rightGridX < level.gridWidth - 1) {
            const tile = level.getTileAt((rightGridX + 1) * TILE_SIZE, checkY * TILE_SIZE);
            if (!tile || !tile.solid || tile.oneWay) break;
            rightGridX++;
        }

        return {
            left: leftGridX * TILE_SIZE,
            right: (rightGridX + 1) * TILE_SIZE
        };
    }

    _updatePatrolAI(dt, pos, vel, enemy, renderable, state) {
        if (state.currentState === 'idle') {
            vel.vx = 0;
            renderable.animationState = 'idle';
            enemy.timer -= dt;
            if (enemy.timer <= 0) {
                state.currentState = 'patrol';
                vel.vx = (renderable.direction === 'right' ? enemy.ai.patrol.speed : -enemy.ai.patrol.speed);
            }
            return;
        }

        const { startX, distance, speed } = enemy.ai.patrol;
        const leftBound = startX;
        const rightBound = startX + distance;

        if (vel.vx === 0) {
            vel.vx = (renderable.direction === 'right' ? speed : -speed);
        }

        if (vel.vx > 0 && pos.x >= rightBound) {
            pos.x = rightBound;
            renderable.direction = 'left';
            state.currentState = 'idle';
            enemy.timer = 0.5;
            vel.vx = 0;
        }

        if (vel.vx < 0 && pos.x <= leftBound) {
            pos.x = leftBound;
            renderable.direction = 'right';
            state.currentState = 'idle';
            enemy.timer = 0.5;
            vel.vx = 0;
        }

        renderable.animationState = enemy.type === 'snail' ? 'walk' : 'run';
    }

    _updateGroundChargeAI(dt, pos, vel, enemy, renderable, state, playerData, col, level) {
        const ai = enemy.ai;

        switch (state.currentState) {
            case 'idle':
                vel.vx = 0;
                renderable.animationState = 'idle';

                if (col.isGrounded) {
                    const edges = this._findPlatformEdges(pos, col, level);
                    if (edges) {
                        const platformCenter = edges.left + (edges.right - edges.left) / 2;
                        renderable.direction = (pos.x + col.width / 2 < platformCenter) ? 'right' : 'left';
                    }
                }

                if (playerData) {
                    const verticalDistance = Math.abs((playerData.y + playerData.height / 2) - (pos.y + col.height / 2));
                    const onSameLevel = verticalDistance < col.height * 1.5;
                    const horizontalDistance = Math.abs((playerData.x + playerData.width / 2) - (pos.x + col.width / 2));
                    const inRange = horizontalDistance <= ai.aggroRange;

                    if (onSameLevel && inRange) {
                        const isPlayerRight = (playerData.x + playerData.width / 2) > (pos.x + col.width / 2);
                        const chargeDirection = isPlayerRight ? 'right' : 'left';
                        
                        const edges = this._findPlatformEdges(pos, col, level);
                        let hasRoomToCharge = true;
                        if (edges) {
                            if (chargeDirection === 'right' && (pos.x + col.width) >= edges.right - 1) {
                                hasRoomToCharge = false;
                            }
                            if (chargeDirection === 'left' && pos.x <= edges.left + 1) {
                                hasRoomToCharge = false;
                            }
                        }

                        if (hasRoomToCharge) {
                            renderable.direction = chargeDirection;
                            state.currentState = 'warning';
                            enemy.timer = ai.idleTime;
                        }
                    }
                }
                break;

            case 'warning':
                vel.vx = 0;
                renderable.animationState = 'idle';
                enemy.timer -= dt;
                if (enemy.timer <= 0) {
                    state.currentState = 'charging';
                    vel.vx = (renderable.direction === 'right' ? 1 : -1) * ai.chargeSpeed;
                }
                break;

            case 'charging':
                renderable.animationState = 'run';

                const edges = this._findPlatformEdges(pos, col, level);
                let atEdge = false;
                if (edges) {
                    if (vel.vx > 0 && (pos.x + col.width) >= edges.right) {
                        atEdge = true;
                        pos.x = edges.right - col.width;
                    } else if (vel.vx < 0 && pos.x <= edges.left) {
                        atEdge = true;
                        pos.x = edges.left;
                    }
                } else {
                    atEdge = true; 
                }

                if (atEdge) {
                    state.currentState = 'cooldown';
                    vel.vx = 0;
                    enemy.timer = ai.cooldownTime;
                }
                break;

            case 'cooldown':
                vel.vx = 0;
                renderable.animationState = 'idle';
                enemy.timer -= dt;
                if (enemy.timer <= 0) {
                    state.currentState = 'idle';
                }
                break;
        }
    }

    _updateDefensiveCycleAI(dt, vel, enemy, renderable, state) {
        vel.vx = 0;
        enemy.timer -= dt;
        if (enemy.timer <= 0) {
            if (state.currentState === 'idle') {
                state.currentState = 'spikes_out_transition';
                renderable.animationState = 'spikes_out'; renderable.animationFrame = 0;
            } else if (state.currentState === 'hiding') {
                state.currentState = 'spikes_in_transition';
                renderable.animationState = 'spikes_in'; renderable.animationFrame = 0;
            }
        }
    }

    _updateHopAI(dt, vel, enemy, renderable, state, col) {
        if (state.currentState === 'idle' && col.isGrounded) {
            vel.vx = 0; renderable.animationState = 'idle_run';
            enemy.timer -= dt;
            if (enemy.timer <= 0) {
                state.currentState = 'hopping';
                vel.vy = -enemy.ai.hopHeight;
                const hopDirection = Math.random() > 0.5 ? 1 : -1;
                vel.vx = hopDirection * enemy.ai.hopSpeed;
                renderable.direction = hopDirection > 0 ? 'right' : 'left';
            }
        } else if (state.currentState === 'hopping' && col.isGrounded && vel.vy >= 0) {
            state.currentState = 'idle'; enemy.timer = enemy.ai.hopInterval;
        }
    }

    _updateDyingState(dt, enemy, vel, entityManager, entityId) {
        vel.vx = 0;
        vel.vy += 200 * dt;
        enemy.deathTimer -= dt;
        if (enemy.deathTimer <= 0) {
            entityManager.destroyEntity(entityId);
            return true;
        }
        return false;
    }

    _updateAnimation(dt, id, entityManager) {
        const renderable = entityManager.getComponent(id, RenderableComponent);
        const enemy = entityManager.getComponent(id, EnemyComponent);
        const state = entityManager.getComponent(id, StateComponent);
        const animDef = ENEMY_DEFINITIONS[enemy.type]?.animations[renderable.animationState];
        if (!animDef) return;
        renderable.animationTimer += dt;
        if (renderable.animationTimer >= animDef.speed) {
            renderable.animationTimer -= animDef.speed;
            renderable.animationFrame++;
            if (renderable.animationFrame >= animDef.frameCount) {
                if (enemy.type === 'turtle') {
                    const killable = entityManager.getComponent(id, KillableComponent);
                    if (renderable.animationState === 'spikes_out') {
                        state.currentState = 'hiding';
                        renderable.animationState = 'idle1';
                        enemy.timer = enemy.ai.spikesOutDuration;
                        renderable.animationFrame = 0;
                        if (killable) {
                            killable.stompable = false;
                            killable.dealsContactDamage = true;
                        }
                    } else if (renderable.animationState === 'spikes_in') {
                        state.currentState = 'idle';
                        renderable.animationState = 'idle2';
                        enemy.timer = enemy.ai.spikesInDuration;
                        renderable.animationFrame = 0;
                        if (killable) {
                            killable.stompable = true;
                            killable.dealsContactDamage = false;
                        }
                    } else {
                        renderable.animationFrame = 0;
                    }
                } else {
                    renderable.animationFrame = 0;
                }
            }
        }
    }
}