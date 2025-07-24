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
                if (enemy.type === 'turtle' && state.currentState !== 'idle') {
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

    update(dt, { entityManager, playerEntityId, playerCol }) {
        this._processStompEvents(entityManager);
        
        const enemyEntities = entityManager.query([EnemyComponent, PositionComponent, VelocityComponent, StateComponent, RenderableComponent]);
        const playerPos = playerEntityId ? entityManager.getComponent(playerEntityId, PositionComponent) : null;
        const playerData = playerPos && playerCol ? { ...playerPos, ...playerCol } : null;

        for (const id of enemyEntities) {
            const enemy = entityManager.getComponent(id, EnemyComponent);
            const pos = entityManager.getComponent(id, PositionComponent);
            const vel = entityManager.getComponent(id, VelocityComponent);
            const state = entityManager.getComponent(id, StateComponent);
            const renderable = entityManager.getComponent(id, RenderableComponent);

            if (enemy.isDead) {
                this._updateDyingState(dt, enemy, vel, entityManager, id);
            } else {
                switch (enemy.ai.type) {
                    case 'patrol': this._updatePatrolAI(dt, pos, vel, enemy, renderable, state); break;
                    case 'ground_charge': this._updateGroundChargeAI(dt, pos, vel, enemy, renderable, state, playerData); break;
                    case 'defensive_cycle': this._updateDefensiveCycleAI(dt, vel, enemy, renderable, state); break;
                    case 'hop': this._updateHopAI(dt, vel, enemy, renderable, state, entityManager.getComponent(id, CollisionComponent)); break;
                }
            }
            
            this._updateAnimation(dt, id, entityManager);

            if (vel.vx > 0) renderable.direction = 'right';
            else if (vel.vx < 0) renderable.direction = 'left';
        }
    }

    _updatePatrolAI(dt, pos, vel, enemy, renderable, state) {
        if (state.currentState === 'idle') {
            enemy.timer -= dt;
            if (enemy.timer <= 0) {
                state.currentState = 'patrol';
                vel.vx = (renderable.direction === 'right' ? 1 : -1) * enemy.ai.patrol.speed;
            }
            return;
        }

        const { startX, distance, speed } = enemy.ai.patrol;
        const leftBound = startX;
        const rightBound = startX + distance;

        if (pos.x <= leftBound) {
            pos.x = leftBound; vel.vx = speed; state.currentState = 'idle'; enemy.timer = 0.5;
        } else if (pos.x >= rightBound) {
            pos.x = rightBound; vel.vx = -speed; state.currentState = 'idle'; enemy.timer = 0.5;
        }
        
        renderable.animationState = enemy.type === 'snail' ? 'walk' : 'run';
        if (state.currentState === 'idle') renderable.animationState = 'idle';
    }

    _updateGroundChargeAI(dt, pos, vel, enemy, renderable, state, playerData) {
        switch(state.currentState) {
            case 'idle':
                vel.vx = 0; renderable.animationState = 'idle';
                if (playerData && playerData.isGrounded) {
                     const distance = Math.abs(playerData.x - pos.x);
                     if (distance <= enemy.ai.aggroRange) {
                         state.currentState = 'warning';
                         enemy.timer = enemy.ai.idleTime;
                         renderable.direction = (playerData.x > pos.x) ? 'right' : 'left';
                     }
                }
                break;
            case 'warning':
                vel.vx = 0; renderable.animationState = 'idle';
                enemy.timer -= dt;
                if(enemy.timer <= 0) {
                    state.currentState = 'charging';
                    vel.vx = (renderable.direction === 'right' ? 1 : -1) * enemy.ai.chargeSpeed;
                    enemy.timer = enemy.ai.chargeTime;
                }
                break;
            case 'charging':
                renderable.animationState = 'run';
                enemy.timer -= dt;
                if(enemy.timer <= 0) {
                    state.currentState = 'cooldown'; vel.vx = 0; enemy.timer = enemy.ai.cooldownTime;
                }
                break;
            case 'cooldown':
                 renderable.animationState = 'idle';
                 enemy.timer -= dt;
                 if(enemy.timer <= 0) { state.currentState = 'idle'; }
                 break;
        }
    }

    _updateDefensiveCycleAI(dt, vel, enemy, renderable, state) {
        vel.vx = 0;
        enemy.timer -= dt;
        
        if (enemy.timer <= 0) {
            if (state.currentState === 'idle') { // Spikes are in
                state.currentState = 'spikes_out_transition';
                renderable.animationState = 'spikes_out'; renderable.animationFrame = 0;
            } else if (state.currentState === 'hiding') { // Spikes are out
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
                vel.vx = (Math.random() > 0.5 ? 1 : -1) * enemy.ai.hopSpeed;
            }
        } else if (state.currentState === 'hopping' && col.isGrounded && vel.vy >= 0) {
            state.currentState = 'idle'; enemy.timer = enemy.ai.hopInterval;
        }
    }
    
    _updateDyingState(dt, enemy, vel, entityManager, entityId) {
        vel.vx = 0; vel.vy += 200 * dt;
        enemy.deathTimer -= dt;
        if (enemy.deathTimer <= 0) {
            entityManager.destroyEntity(entityId);
        }
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
                    if (renderable.animationState === 'spikes_out') {
                        state.currentState = 'hiding';
                        enemy.timer = enemy.ai.spikesOutDuration;
                    } else if (renderable.animationState === 'spikes_in') {
                        state.currentState = 'idle';
                        enemy.timer = enemy.ai.spikesInDuration;
                    }
                }
                renderable.animationFrame = 0;
            }
        }
    }
}