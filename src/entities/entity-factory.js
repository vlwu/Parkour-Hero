import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { CharacterComponent } from '../components/CharacterComponent.js';
import { PLAYER_CONSTANTS, GRID_CONSTANTS } from '../utils/constants.js';
import { InputComponent } from '../components/InputComponent.js';
import { StateComponent } from '../components/StateComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { DamageOnContactComponent } from '../components/DamageOnContactComponent.js';
import { BouncePlatformComponent } from '../components/BouncePlatformComponent.js';
import { PeriodicDamageComponent } from '../components/PeriodicDamageComponent.js';

export function createPlayer(entityManager, x, y, characterId) {
    const playerEntityId = entityManager.createEntity();

    entityManager.addComponent(playerEntityId, new PositionComponent(x, y));
    entityManager.addComponent(playerEntityId, new VelocityComponent());
    entityManager.addComponent(playerEntityId, new CharacterComponent(characterId));
    entityManager.addComponent(playerEntityId, new RenderableComponent({
        spriteKey: null, 
        width: PLAYER_CONSTANTS.SPAWN_WIDTH,
        height: PLAYER_CONSTANTS.SPAWN_HEIGHT,
        animationState: 'spawn',
    }));
    entityManager.addComponent(playerEntityId, new PlayerControlledComponent());
    entityManager.addComponent(playerEntityId, new CollisionComponent({
        type: 'dynamic',
        solid: true,
        width: PLAYER_CONSTANTS.WIDTH,
        height: PLAYER_CONSTANTS.HEIGHT,
    }));
    entityManager.addComponent(playerEntityId, new InputComponent());
    entityManager.addComponent(playerEntityId, new StateComponent('spawn'));
    entityManager.addComponent(playerEntityId, new HealthComponent());

    return playerEntityId;
}


export function createSpike(entityManager, x_tl, y_tl) {
    const colWidth = 16;
    const colHeight = 16;
    const centerX = x_tl + GRID_CONSTANTS.TILE_SIZE / 2;
    const centerY = y_tl;

    const entityId = entityManager.createEntity();
    entityManager.addComponent(entityId, new PositionComponent(centerX, centerY));
    entityManager.addComponent(entityId, new RenderableComponent({
        spriteKey: 'spike_two',
        width: 16,
        height: 16,
    }));
    entityManager.addComponent(entityId, new CollisionComponent({
        type: 'hazard',
        width: colWidth,
        height: colHeight,
    }));
    entityManager.addComponent(entityId, new DamageOnContactComponent({ amount: 25, source: 'spike' }));
    return entityId;
}

export function createTrampoline(entityManager, x_tl, y_tl) {
    const colWidth = 28;
    const colHeight = 28;
    const centerX = x_tl + GRID_CONSTANTS.TILE_SIZE / 2;
    const centerY = y_tl + (colHeight / 2) - 14;

    const entityId = entityManager.createEntity();
    entityManager.addComponent(entityId, new PositionComponent(centerX, centerY));
    entityManager.addComponent(entityId, new RenderableComponent({
        spriteKey: 'trampoline', 
        width: 28,
        height: 28,
        animationState: 'idle',
        animationConfig: {
            idle: { frames: 1, speed: 1, loop: false },
            jump: { frames: 8, speed: 0.05, loop: false }
        }
    }));
    entityManager.addComponent(entityId, new CollisionComponent({
        type: 'platform',
        width: colWidth,
        height: colHeight,
    }));
    entityManager.addComponent(entityId, new BouncePlatformComponent());
    return entityId;
}

export function createFireTrap(entityManager, x_tl, y_tl) {
    const colWidth = 16;
    const colHeight = 16;
    const centerX = x_tl + GRID_CONSTANTS.TILE_SIZE / 2;
    const centerY = y_tl + colHeight / 2 - 16;

    const entityId = entityManager.createEntity();
    entityManager.addComponent(entityId, new PositionComponent(centerX, centerY));
    entityManager.addComponent(entityId, new RenderableComponent({
        spriteKey: 'fire', 
        width: 16,
        height: 32, 
        animationState: 'off',
        animationConfig: {
            off: { frames: 1, speed: 1, loop: false },
            hit: { frames: 4, speed: 0.1, loop: false },
            on: { frames: 3, speed: 0.15, loop: true }
        }
    }));
    entityManager.addComponent(entityId, new CollisionComponent({
        type: 'hazard',
        solid: true,
        width: colWidth,
        height: colHeight, 
    }));
    entityManager.addComponent(entityId, new PeriodicDamageComponent({ amount: 10, interval: 0.8, source: 'fire' }));
    return entityId;
}