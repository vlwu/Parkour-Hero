import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { StateComponent } from '../components/StateComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';

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

            if (enemy && !enemy.isDead) {
                // Special case for Turtle: can only be killed if spikes are in.
                if (enemy.type === 'turtle' && state.currentState !== 'idle') {
                    eventBus.publish('playSound', { key: 'hit', volume: 0.9, channel: 'SFX' }); // Sound of hitting spikes
                    continue;
                }

                // Special case for Snail: creates a shell.
                if (enemy.type === 'snail') {
                    // We'll implement shell creation in a future step. For now, it dies normally.
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

    update(dt, { entityManager, playerEntityId }) {
        this._processStompEvents(entityManager);
        
        const enemyEntities = entityManager.query([EnemyComponent, PositionComponent, VelocityComponent, StateComponent, RenderableComponent]);
        
        const playerPos = playerEntityId ? entityManager.getComponent(playerEntityId, PositionComponent) : null;
        const playerCol = playerEntityId ? entityManager.getComponent(playerEntityId, CollisionComponent) : null;
        const playerData = playerPos && playerCol ? { ...playerPos, ...playerCol } : null;

        for (const id of enemyEntities) {
            const enemy = entityManager.getComponent(id, EnemyComponent);
            const pos = entityManager.getComponent(id, PositionComponent);
            const vel = entityManager.getComponent(id, VelocityComponent);
            const state = entityManager.getComponent(id, StateComponent);
            const renderable = entityManager.getComponent(id, RenderableComponent);

            if (enemy.isDead) {
                this._updateDyingState(dt, enemy, vel, renderable, entityManager, id);
                continue;
            }

            // --- State Machine ---
            const aiType = ENEMY_DEFINITIONS[enemy.type].ai.type;
            switch (aiType) {
                case 'patrol':
                    this._updatePatrolAI(pos, vel, enemy, renderable, state);
                    break;
                case 'ground_charge':
                    this._updateGroundChargeAI(dt, pos, vel, enemy, renderable, state, playerData);
                    break;
                case 'defensive_cycle':
                    this._updateDefensiveCycleAI(dt, vel, enemy, renderable, state);
                    break;
                case 'hop':
                    this._updateHopAI(dt, vel, enemy, renderable, state, entityManager.getComponent(id, CollisionComponent));
                    break;
            }
            
            this._updateAnimation(dt, renderable, enemy.type);

            if (vel.vx > 0) renderable.direction = 'right';
            else if (vel.vx < 0) renderable.direction = 'left';
        }
    }

    // --- AI Behaviors ---
    _updatePatrolAI(pos, vel, enemy, renderable, state) {
        const { startX, distance, speed } = enemy.patrol;
        const leftBound = startX;
        const rightBound = startX + distance;

        if (vel.vx === 0) vel.vx = speed;

        if (pos.x <= leftBound) { pos.x = leftBound; vel.vx = speed; } 
        else if (pos.x >= rightBound) { pos.x = rightBound; vel.vx = -speed; }
        
        renderable.animationState = enemy.type === 'snail' ? 'walk' : 'run';
    }

    _updateGroundChargeAI(dt, pos, vel, enemy, renderable, state, playerData) {
        switch(state.currentState) {
            case 'idle':
                vel.vx = 0;
                renderable.animationState = 'idle';
                enemy.timer = (enemy.timer || 0) - dt;
                if (enemy.timer <= 0 && playerData && playerData.isGrounded) {
                     const distance = Math.abs(playerData.x - pos.x);
                     if (distance <= enemy.aggroRange) {
                         state.currentState = 'charging';
                         renderable.direction = (playerData.x > pos.x) ? 'right' : 'left';
                         vel.vx = (renderable.direction === 'right' ? 1 : -1) * enemy.chargeSpeed;
                         enemy.timer = enemy.chargeTime;
                     }
                }
                break;
            case 'charging':
                renderable.animationState = 'run';
                enemy.timer -= dt;
                if(enemy.timer <= 0) {
                    state.currentState = 'cooldown';
                    vel.vx = 0;
                    enemy.timer = enemy.cooldownTime;
                }
                break;
            case 'cooldown':
                 renderable.animationState = 'idle';
                 enemy.timer -= dt;
                 if(enemy.timer <= 0) {
                     state.currentState = 'idle';
                     enemy.timer = enemy.idleTime;
                 }
                 break;
        }
    }

    _updateDefensiveCycleAI(dt, vel, enemy, renderable, state) {
        vel.vx = 0; // Turtle is immobile
        enemy.timer = (enemy.timer || 0) - dt;
        
        switch(state.currentState) {
            case 'idle': // Spikes in
                renderable.animationState = 'idle1';
                if (enemy.timer <= 0) {
                    state.currentState = 'spikes_out_transition';
                    renderable.animationState = 'spikes_out';
                    renderable.animationFrame = 0;
                }
                break;
            case 'hiding': // Spikes out
                if (enemy.timer <= 0) {
                    state.currentState = 'spikes_in_transition';
                    renderable.animationState = 'spikes_in';
                    renderable.animationFrame = 0;
                }
                break;
            case 'spikes_out_transition':
                // The animation system handles moving to the next state
                break;
            case 'spikes_in_transition':
                // The animation system handles moving to the next state
                break;
        }
    }

    _updateHopAI(dt, vel, enemy, renderable, state, col) {
        vel.vx = 0; // Slime only moves when hopping
        if (state.currentState === 'idle' && col.isGrounded) {
            renderable.animationState = 'idle_run';
            enemy.timer = (enemy.timer || 0) - dt;
            if (enemy.timer <= 0) {
                state.currentState = 'hopping';
                vel.vy = -enemy.hopHeight;
                vel.vx = (Math.random() > 0.5 ? 1 : -1) * enemy.hopSpeed;
            }
        } else if (state.currentState === 'hopping' && col.isGrounded) {
            state.currentState = 'idle';
            enemy.timer = enemy.hopInterval;
        }
    }
    
    // --- State & Animation ---
    _updateDyingState(dt, enemy, vel, renderable, entityManager, entityId) {
        vel.vx = 0;
        vel.vy += 200 * dt;
        enemy.deathTimer -= dt;
        if (enemy.deathTimer <= 0) {
            entityManager.destroyEntity(entityId);
        }
    }

    _updateAnimation(dt, renderable, type) {
        const animDef = ENEMY_DEFINITIONS[type]?.animations[renderable.animationState];
        if (!animDef) return;

        renderable.animationTimer += dt;
        if (renderable.animationTimer >= animDef.speed) {
            renderable.animationTimer -= animDef.speed;
            renderable.animationFrame++;

            if (renderable.animationFrame >= animDef.frameCount) {
                // Handle transitions for state machine-driven animations (like turtle)
                const enemy = entityManager.getComponent(id, EnemyComponent);
                const state = entityManager.getComponent(id, StateComponent);
                if (type === 'turtle') {
                    if (renderable.animationState === 'spikes_out') {
                        state.currentState = 'hiding';
                        enemy.timer = enemy.spikesOutDuration;
                    } else if (renderable.animationState === 'spikes_in') {
                        state.currentState = 'idle';
                        enemy.timer = enemy.spikesInDuration;
                    }
                }
                
                renderable.animationFrame = 0; // Loop animation
            }
        }
    }
}