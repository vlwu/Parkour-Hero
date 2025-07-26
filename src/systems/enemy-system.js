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

            if (enemy.type === 'snail' && !enemy.isDead) {
                if (enemy.snailState === 'walking') {
                    enemy.snailState = 'shell';
                    state.currentState = 'shell_patrol';
                    renderable.animationState = 'shell_idle';
                    renderable.animationFrame = 0;
                    collision.solid = true;
                    
                    const pos = entityManager.getComponent(enemyId, PositionComponent);
                    eventBus.publish('createParticles', {
                        x: pos.x + collision.width / 2,
                        y: pos.y + collision.height / 2,
                        type: 'snail_flee'
                    });
                    eventBus.publish('playSound', { key: 'enemy_stomp', volume: 0.9, channel: 'SFX' });

                } else if (enemy.snailState === 'shell') {
                    enemy.isDead = true;
                    state.currentState = 'dying';
                    renderable.animationState = 'shell_top_hit';
                    renderable.animationFrame = 0;
                    renderable.animationTimer = 0;
                    collision.solid = false;
                    enemy.deathTimer = 0.5;
                    eventBus.publish('playSound', { key: 'enemy_stomp', volume: 0.9, channel: 'SFX' });
                }
            } else if (enemy && !enemy.isDead) {
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
                if (enemy.type === 'snail' && enemy.snailState === 'shell') {
                    this._updateShellAI(dt, pos, vel, enemy, renderable, state, col, level);
                } else {
                    switch (enemy.ai.type) {
                        case 'patrol': this._updatePatrolAI(dt, pos, vel, enemy, renderable, state, col, level); break;
                        case 'ground_charge': this._updateGroundChargeAI(dt, pos, vel, enemy, renderable, state, playerData, col, level); break;
                        case 'defensive_cycle': this._updateDefensiveCycleAI(dt, vel, enemy, renderable, state); break;
                        case 'hop': this._updateHopAI(dt, vel, enemy, renderable, state, entityManager.getComponent(id, CollisionComponent)); break;
                    }
                }

                if (enemy.type === 'slime' && enemy.ai.particleDropInterval && Math.abs(vel.vx) > 0) {
                    enemy.particleDropTimer -= dt;
                    if (enemy.particleDropTimer <= 0) {
                        enemy.particleDropTimer = enemy.ai.particleDropInterval;
                        const particlePos = { x: pos.x + col.width / 2, y: pos.y + col.height - 2 };
                        
                        eventBus.publish('createParticles', { ...particlePos, type: 'slime_puddle' });
                        eventBus.publish('createSlimePuddle', particlePos);
                    }
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

    _updatePatrolAI(dt, pos, vel, enemy, renderable, state, col, level) {
        const ai = enemy.ai;
        const speed = ai.patrol.speed;
    
        if (state.currentState === 'idle') {
            renderable.animationState = enemy.type === 'slime' ? 'idle_run' : 'idle';
        } else {
            renderable.animationState = enemy.type === 'snail' ? 'walk' : 'run';
            if (enemy.type === 'slime') renderable.animationState = 'idle_run';
        }
    
        switch (state.currentState) {
            case 'idle':
                vel.vx = 0;
                enemy.timer -= dt;
                if (enemy.timer <= 0) {
                    state.currentState = 'patrol';
                }
                break;
    
            case 'patrol':
                vel.vx = renderable.direction === 'right' ? speed : -speed;
    
                // --- BUG FIX START: Self-contained AI movement checks ---
                // Edge detection: Check for solid ground one step ahead.
                const groundProbeX = renderable.direction === 'right' 
                    ? pos.x + col.width // Check at the right edge
                    : pos.x;           // Check at the left edge
                const groundProbeY = pos.y + col.height + 1; // 1 pixel below feet
                const groundAhead = level.getTileAt(groundProbeX, groundProbeY);
                const atEdge = !groundAhead.solid || groundAhead.oneWay;
    
                // Wall detection: Check for a solid wall at mid-height.
                const wallProbeX = renderable.direction === 'right' 
                    ? pos.x + col.width + 1  // 1 pixel ahead of right edge
                    : pos.x - 1;             // 1 pixel ahead of left edge
                const wallProbeY = pos.y + col.height / 2; // Check at the enemy's vertical center
                const wallAhead = level.getTileAt(wallProbeX, wallProbeY);
                const hitWall = wallAhead.solid && !wallAhead.oneWay;
    
                if (atEdge || hitWall) {
                    renderable.direction = (renderable.direction === 'right' ? 'left' : 'right');
                    state.currentState = 'idle';
                    enemy.timer = 0.5;
                }
                // --- BUG FIX END ---
                break;
        }
    }

    _updateShellAI(dt, pos, vel, enemy, renderable, state, col, level) {
        const ai = enemy.ai;
        const speed = ai.shellSpeed;

        switch (state.currentState) {
            case 'shell_patrol':
                renderable.animationState = 'shell_idle';
                vel.vx = renderable.direction === 'right' ? speed : -speed;

                const groundProbeX = renderable.direction === 'right' ? pos.x + col.width + 1 : pos.x - 1;
                const groundProbeY = pos.y + col.height + 1;
                const groundAhead = level.getTileAt(groundProbeX, groundProbeY);
                const atEdge = !groundAhead.solid || groundAhead.oneWay;

                const wallProbeX = renderable.direction === 'right' ? pos.x + col.width + 1 : pos.x - 1;
                const wallProbeY = pos.y + col.height / 2;
                const wallAhead = level.getTileAt(wallProbeX, wallProbeY);
                const hitWall = wallAhead.solid && !wallAhead.oneWay;

                if (atEdge || hitWall) {
                    renderable.direction = (renderable.direction === 'right' ? 'left' : 'right');
                    state.currentState = 'shell_hit_wall';
                    renderable.animationState = 'shell_wall_hit';
                    renderable.animationFrame = 0;
                    eventBus.publish('playSound', { key: 'snail_wall_hit', volume: 0.5, channel: 'SFX' });
                }
                break;

            case 'shell_hit_wall':
                vel.vx = 0;
                break;
        }
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
                vel.vx = (renderable.direction === 'right' ? 1 : -1) * ai.chargeSpeed;

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
        renderable.animationState = 'idle_run'; // Always use the idle_run animation
        if (state.currentState === 'idle' && col.isGrounded) {
            vel.vx = 0;
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
            const pos = entityManager.getComponent(entityId, PositionComponent);
            const col = entityManager.getComponent(entityId, CollisionComponent);
            if (pos && col) {
                eventBus.publish('createParticles', {
                    x: pos.x + col.width / 2,
                    y: pos.y + col.height / 2,
                    type: 'enemy_death'
                });
            }
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
                } else if (enemy.type === 'snail' && renderable.animationState === 'shell_wall_hit') {
                    state.currentState = 'shell_patrol';
                    renderable.animationState = 'shell_idle';
                    renderable.animationFrame = 0;
                } else {
                    renderable.animationFrame = 0;
                }
            }
        }
    }
}