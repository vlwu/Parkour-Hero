import { eventBus } from '../utils/event-bus.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { PreviousPositionComponent } from '../components/PreviousPositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { StateComponent } from '../components/StateComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { CharacterComponent } from '../components/CharacterComponent.js';
import { PLAYER_CONSTANTS, EVENTS, PLAYER_STATES, COSMETICS, PARTICLE_CONFIGS } from '../utils/constants.js';
import { characterConfig } from '../entities/level-definitions.js';
import { AuraComponent } from '../components/AuraComponent.js';

export class PlayerLifecycleSystem {
    constructor() {
        this.lastCheckpoint = null;
        this.fruitsAtLastCheckpoint = new Set();
        this.coinsAtLastCheckpoint = 0;
        
        this.damageQueue = [];
        this.diedQueue = [];
        this.checkpointQueue = [];
        this.fruitQueue = [];
        this.quickRespawnQueue = [];

        this.comboCounter = 0;
        this.comboTimer = 0;
        
        eventBus.subscribe(EVENTS.PLAYER_TOOK_DAMAGE, (data) => this.damageQueue.push(data));
        eventBus.subscribe(EVENTS.PLAYER_DIED, () => this.diedQueue.push({}));
        eventBus.subscribe(EVENTS.CHECKPOINT_ACTIVATED, (cp) => this.checkpointQueue.push(cp));
        eventBus.subscribe(EVENTS.FRUIT_COLLECTED, (fruit) => this.fruitQueue.push(fruit));
        eventBus.subscribe(EVENTS.QUICK_RESPAWN_REQUESTED, () => this.quickRespawnQueue.push({}));
    }
    
    reset() {
        this.lastCheckpoint = null;
        this.fruitsAtLastCheckpoint.clear();
        this.coinsAtLastCheckpoint = 0;
        this.damageQueue = [];
        this.diedQueue = [];
        this.checkpointQueue = [];
        this.fruitQueue = [];
        this.quickRespawnQueue = [];

        this.comboCounter = 0;
        this.comboTimer = 0;
    }
    
    update(dt, context) {
        const { entityManager, playerEntityId, camera, level, gameState, isRunning, collisionSystem } = context;
        if (!isRunning) return;

        // Process Combo Timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.comboCounter = 0;
            }
        }

        // Process Quick Respawn
        for (const _ of this.quickRespawnQueue) {
            const playerCtrl = entityManager.getComponent(playerEntityId, PlayerControlledComponent);
            if (playerCtrl && !playerCtrl.isDead && !playerCtrl.needsRespawn && !playerCtrl.isDespawning && !playerCtrl.isSpawning) {
                playerCtrl.deathCount++;
                this._respawnPlayer(context);
            }
        }
        this.quickRespawnQueue = [];

        // Process Fruits
        for (const fruit of this.fruitQueue) {
            this.comboCounter++;
            this.comboTimer = 2.0;

            const comboReward = 1 * this.comboCounter;
            level.collectedCoins = (level.collectedCoins || 0) + comboReward;

            level.collectFruit(fruit);

            const pRate = 1.0 + (this.comboCounter - 1) * 0.05;
            eventBus.publish(EVENTS.PLAY_SOUND, { key: 'collect', volume: 0.8, channel: 'SFX', playbackRate: pRate });

            if (this.comboCounter > 1) {
                eventBus.publish(EVENTS.CREATE_DAMAGE_INDICATOR, {
                    x: fruit.x,
                    y: fruit.y - 20,
                    text: `x${this.comboCounter}`,
                    color: '#FFD700'
                });
            }

            const health = entityManager.getComponent(playerEntityId, HealthComponent);
            if (health && health.currentHealth < health.maxHealth) {
                health.currentHealth = Math.min(health.maxHealth, health.currentHealth + 10);
            }
        }
        this.fruitQueue = [];
        
        // Process Checkpoints
        for (const cp of this.checkpointQueue) {
            cp.state = 'activating';
            this.lastCheckpoint = { x: cp.x, y: cp.y - cp.size / 2 };
            eventBus.publish(EVENTS.PLAY_SOUND, { key: 'checkpoint_activated', volume: 1, channel: 'UI' });
            this.fruitsAtLastCheckpoint.clear();
            level.fruits.forEach((fruit, index) => { if (fruit.collected) this.fruitsAtLastCheckpoint.add(index); });
            this.coinsAtLastCheckpoint = level.collectedCoins || 0;
            level.checkpoints.forEach(otherCp => { if (otherCp !== cp && otherCp.state === 'active') { otherCp.state = 'inactive'; otherCp.frame = 0; } });
        }
        this.checkpointQueue = [];
        
        // Process Damage
        for (const { amount } of this.damageQueue) {
            const health = entityManager.getComponent(playerEntityId, HealthComponent);
            const playerCtrl = entityManager.getComponent(playerEntityId, PlayerControlledComponent);
            if (health && playerCtrl && !playerCtrl.isHit && !playerCtrl.needsRespawn && !playerCtrl.isDead) {
                
                let finalAmount = amount;
                if (playerCtrl.damageTakenMult) {
                    finalAmount *= playerCtrl.damageTakenMult;
                }

                health.currentHealth = Math.max(0, health.currentHealth - finalAmount);
                const pos = entityManager.getComponent(playerEntityId, PositionComponent);
                const col = entityManager.getComponent(playerEntityId, CollisionComponent);
                if (pos && col) {
                    eventBus.publish(EVENTS.CREATE_DAMAGE_INDICATOR, {
                        amount: finalAmount,
                        x: pos.x + col.width / 2,
                        y: pos.y
                    });
                }
                if (camera) camera.shake(8, 0.3);
                if (health.currentHealth <= 0) this.diedQueue.push({});
            }
        }
        this.damageQueue = [];
        
        // Process Deaths
        for (const _ of this.diedQueue) {
            const playerCtrl = entityManager.getComponent(playerEntityId, PlayerControlledComponent);
            if (playerCtrl && !playerCtrl.needsRespawn && !playerCtrl.isDead) {
                const vel = entityManager.getComponent(playerEntityId, VelocityComponent);
                const state = entityManager.getComponent(playerEntityId, StateComponent);
                const renderable = entityManager.getComponent(playerEntityId, RenderableComponent);
                const pos = entityManager.getComponent(playerEntityId, PositionComponent);
                const col = entityManager.getComponent(playerEntityId, CollisionComponent);
                
                playerCtrl.isDead = true;

                // Dynamically fetch length of specific death effect, plus a small buffer
                const deathType = gameState.equippedCosmetics ? gameState.equippedCosmetics.death : 'default_death';
                let deathDuration = 1.0;
                const deathConfig = PARTICLE_CONFIGS[deathType];
                if (deathConfig) {
                    if (deathConfig.animation) {
                        deathDuration = deathConfig.animation.frameCount * deathConfig.animation.frameSpeed;
                    } else if (deathConfig.life) {
                        deathDuration = deathConfig.life;
                    }
                }
                playerCtrl.respawnDelayTimer = deathDuration + 0.2; // Wait for animation + buffer before respawning
                
                playerCtrl.needsRespawn = true;
                playerCtrl.deathCount++;
                vel.vx = 0; vel.vy = 0;
                playerCtrl.isHit = true;
                state.currentState = PLAYER_STATES.HIT;
                renderable.animationState = PLAYER_STATES.HIT;
                renderable.animationFrame = 0;
                renderable.animationTimer = 0;
                
                eventBus.publish(EVENTS.PLAY_SOUND, { key: 'death_sound', volume: 0.3, channel: 'SFX' });
                eventBus.publish('createParticles', { type: deathType, x: pos.x + col.width/2, y: pos.y + col.height/2 });
                
                // Hide player during the death animation so particles take the spotlight
                renderable.isVisible = false;

                const enemyEntities = entityManager.query([EnemyComponent, StateComponent]);
                for (const enemyId of enemyEntities) {
                    const enemy = entityManager.getComponent(enemyId, EnemyComponent);
                    if (enemy.type === 'rhino') {
                        const enemyState = entityManager.getComponent(enemyId, StateComponent);
                        if (enemyState.currentState === 'charging') {
                            eventBus.publish(EVENTS.STOP_SOUND_LOOP, { key: 'rhino_charge' });
                            break;
                        }
                    }
                }
            }
        }
        this.diedQueue = [];
        
        // Process Respawn Delay
        const playerCtrl = entityManager.getComponent(playerEntityId, PlayerControlledComponent);
        if (playerCtrl && playerCtrl.needsRespawn && !gameState.showingLevelComplete) {
            if (playerCtrl.respawnDelayTimer > 0) {
                playerCtrl.respawnDelayTimer -= dt;
            } else {
                playerCtrl.isDead = false;
                this._respawnPlayer(context);
            }
        }
    }
    
    _respawnPlayer(context) {
        const { entityManager, playerEntityId, level, camera, collisionSystem, gameState } = context;
        
        const respawnPosition = this.lastCheckpoint || level.startPosition;
        if (this.lastCheckpoint) {
            level.fruits.forEach((fruit, index) => fruit.collected = this.fruitsAtLastCheckpoint.has(index));
            level.collectedCoins = this.coinsAtLastCheckpoint;
        } else {
            level.fruits.forEach(f => f.collected = false);
            level.collectedCoins = 0;
        }
        level.recalculateCollectedFruits();
        
        this.comboCounter = 0;
        this.comboTimer = 0;

        eventBus.publish('resetEffects');
        
        if (level.trophy) {
            level.trophy.acquired = false;
            level.trophy.isAnimating = false;
            level.trophy.animationFrame = 0;
            level.trophy.animationTimer = 0;
            level.trophy.inactive = !level.allFruitsCollected();
        }

        level.resetEnemies(entityManager, collisionSystem);

        const pos = entityManager.getComponent(playerEntityId, PositionComponent);
        const vel = entityManager.getComponent(playerEntityId, VelocityComponent);
        const oldPlayerCtrl = entityManager.getComponent(playerEntityId, PlayerControlledComponent);
        const renderable = entityManager.getComponent(playerEntityId, RenderableComponent);
        const collision = entityManager.getComponent(playerEntityId, CollisionComponent);
        const state = entityManager.getComponent(playerEntityId, StateComponent);
        const health = entityManager.getComponent(playerEntityId, HealthComponent);
        const prevPos = entityManager.getComponent(playerEntityId, PreviousPositionComponent);
        const charComp = entityManager.getComponent(playerEntityId, CharacterComponent);

        pos.x = respawnPosition.x; pos.y = respawnPosition.y;
        if (prevPos) {
            prevPos.x = respawnPosition.x;
            prevPos.y = respawnPosition.y;
        }
        vel.vx = 0; vel.vy = 0;
        if (health) health.currentHealth = health.maxHealth;

        const currentDeathCount = oldPlayerCtrl.deathCount;
        const currentSound = oldPlayerCtrl.activeSurfaceSound;

        const config = characterConfig[charComp ? charComp.characterId : 'PinkMan'] || characterConfig['PinkMan'];
        
        let mutatorStats = {};
        if (gameState && gameState.equippedCosmetics && gameState.equippedCosmetics.mutator) {
            const mutatorDef = COSMETICS.mutator.find(m => m.id === gameState.equippedCosmetics.mutator);
            if (mutatorDef && mutatorDef.modifiers) {
                mutatorStats = mutatorDef.modifiers;
            }
        }
        const finalStats = { ...config.stats, ...mutatorStats };

        entityManager.addComponent(playerEntityId, new PlayerControlledComponent({ stats: finalStats }));
        
        entityManager.removeComponent(playerEntityId, AuraComponent);
        if (gameState && gameState.equippedCosmetics && gameState.equippedCosmetics.aura) {
            const auraDef = COSMETICS.aura.find(a => a.id === gameState.equippedCosmetics.aura);
            if (auraDef && auraDef.auraConfig) {
                entityManager.addComponent(playerEntityId, new AuraComponent(auraDef.auraConfig));
            }
        }

        const newPlayerCtrl = entityManager.getComponent(playerEntityId, PlayerControlledComponent);
        newPlayerCtrl.deathCount = currentDeathCount;
        newPlayerCtrl.activeSurfaceSound = currentSound;
        newPlayerCtrl.needsRespawn = false;

        state.currentState = PLAYER_STATES.SPAWN;
        renderable.animationState = PLAYER_STATES.SPAWN;
        renderable.animationFrame = 0;
        renderable.animationTimer = 0;
        renderable.direction = 'right';
        renderable.width = PLAYER_CONSTANTS.SPAWN_WIDTH;
        renderable.height = PLAYER_CONSTANTS.SPAWN_HEIGHT;
        renderable.isVisible = true; // Ensure they are visible again
        collision.isGrounded = false;
        collision.isAgainstWall = false;
        collision.groundType = null;

        if (camera) camera.shake(15, 0.5);
        eventBus.publish(EVENTS.PLAYER_RESPAWNED);
    }
}