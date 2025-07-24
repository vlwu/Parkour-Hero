import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { CharacterComponent } from '../components/CharacterComponent.js';
import { PLAYER_CONSTANTS } from '../utils/constants.js';
import { InputComponent } from '../components/InputComponent.js';
import { StateComponent } from '../components/StateComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { DynamicColliderComponent } from '../components/DynamicColliderComponent.js';

/**
 * Creates a player entity and adds its components to the entity manager.
 * This function acts as a "recipe" for what a player entity is.
 * @param {EntityManager} entityManager The entity manager instance.
 * @param {number} x The initial x-position.
 * @param {number} y The initial y-position.
 * @param {string} characterId The ID for the selected character.
 * @returns {number} The ID of the newly created player entity.
 */
export function createPlayer(entityManager, x, y, characterId) {
    const playerEntityId = entityManager.createEntity();

    // The 'x' and 'y' from the level data represent the center of the spawn point.
    // The PositionComponent requires the top-left coordinates.
    const topLeftX = x - PLAYER_CONSTANTS.WIDTH / 2;
    const topLeftY = y - PLAYER_CONSTANTS.HEIGHT / 2;

    entityManager.addComponent(playerEntityId, new PositionComponent(topLeftX, topLeftY));
    entityManager.addComponent(playerEntityId, new VelocityComponent());
    entityManager.addComponent(playerEntityId, new CharacterComponent(characterId));

    // Player starts in the 'spawn' state
    entityManager.addComponent(playerEntityId, new RenderableComponent({
        spriteKey: null, // Sprite key is now derived in the renderer
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
    
    // Add the components required for the refactored systems.
    entityManager.addComponent(playerEntityId, new InputComponent());
    entityManager.addComponent(playerEntityId, new StateComponent('spawn'));
    entityManager.addComponent(playerEntityId, new HealthComponent());
    entityManager.addComponent(playerEntityId, new DynamicColliderComponent());

    return playerEntityId;
}