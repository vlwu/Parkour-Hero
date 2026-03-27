import { eventBus } from '../utils/event-bus.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { StateComponent } from '../components/StateComponent.js';
import { PLAYER_CONSTANTS } from '../utils/constants.js';

export class GameFlowSystem {
    constructor() {
        this.levelTime = 0;
    }

    reset(isRunning) {
        this.levelTime = 0;
    }

    update(dt, { entityManager, playerEntityId, level, isRunning, gameState, levelManager }) {
        if (isRunning && !gameState.showingLevelComplete) {
            this.levelTime += dt;
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
                fruitsCollected: level.collectedFruitCount
            };

            const levelId = `${gameState.currentSection}-${gameState.currentLevelIndex}`;
            const currentStats = gameState.levelStats[levelId];
            const isNewRecord = currentStats ? (currentStats.fastestTime === null || runStats.time < currentStats.fastestTime) : true;

            const newGameState = gameState.onLevelComplete(runStats);
            if (newGameState !== gameState) {
                eventBus.publish('gameStateUpdated', newGameState);
                eventBus.publish('pauseGame'); 

                if (newGameState.newlyUnlockedCharacter) {
                    eventBus.publish('characterUnlocked', newGameState.newlyUnlockedCharacter);
                }

                eventBus.publish('levelComplete', {
                    deaths: runStats.deaths,
                    time: runStats.time,
                    fruitsCollected: runStats.fruitsCollected,
                    isNewRecord: isNewRecord,
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