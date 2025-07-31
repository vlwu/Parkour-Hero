import { eventBus } from '../utils/event-bus.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { StateComponent } from '../components/StateComponent.js';
import { PLAYER_CONSTANTS } from '../utils/constants.js';

export class GameFlowSystem {
    constructor() {
        this.levelStartTime = 0;
        this.levelTime = 0;
    }

    reset(isRunning) {
        if (isRunning) {
            this.levelStartTime = performance.now();
        } else {
            this.levelStartTime = 0;
        }
        this.levelTime = 0;
    }

    update(dt, { entityManager, playerEntityId, level, isRunning, gameState, levelManager }) {
        if (this.levelStartTime === 0 && isRunning) {
            this.levelStartTime = performance.now();
        }

        if (isRunning && !gameState.showingLevelComplete) {
            this.levelTime = (performance.now() - this.levelStartTime) / 1000;
        }

        const playerCtrl = entityManager.getComponent(playerEntityId, PlayerControlledComponent);
        if (!playerCtrl) return;

        // Check for win condition
        if (level.trophy && level.trophy.acquired && !playerCtrl.isDespawning) {
            this._startPlayerDespawnSequence(entityManager, playerEntityId);
        }

        // Check for level completion sequence finish
        if (playerCtrl.despawnAnimationFinished && !gameState.showingLevelComplete) {
            playerCtrl.despawnAnimationFinished = false;

            const runStats = {
                deaths: playerCtrl.deathCount,
                time: this.levelTime,
            };

            const newGameState = gameState.onLevelComplete(runStats);
            if (newGameState !== gameState) {
                eventBus.publish('gameStateUpdated', newGameState);
                eventBus.publish('pauseGame'); // Use a generic event to signal the engine

                eventBus.publish('levelComplete', {
                    deaths: runStats.deaths,
                    time: runStats.time,
                    hasNextLevel: levelManager.hasNextLevel(),
                    hasPreviousLevel: levelManager.hasPreviousLevel(),
                });
            }
        }
    }

    _startPlayerDespawnSequence(entityManager, playerEntityId) {
        const playerCtrl = entityManager.getComponent(playerEntityId, PlayerControlledComponent);
        const renderable = entityManager.getComponent(playerEntityId, RenderableComponent);
        const state = entityManager.getComponent(playerEntityId, StateComponent);

        if (playerCtrl && !playerCtrl.isDespawning) {
            eventBus.publish('cameraShakeRequested', { intensity: 8, duration: 0.3 });
            playerCtrl.isDespawning = true;
            renderable.animationState = 'despawn';
            state.currentState = 'despawn';
            renderable.animationFrame = 0;
            renderable.animationTimer = 0;
            renderable.width = PLAYER_CONSTANTS.SPAWN_WIDTH;
            renderable.height = PLAYER_CONSTANTS.SPAWN_HEIGHT;
        }
    }
}