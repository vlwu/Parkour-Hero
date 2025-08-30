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

export function createPlayer(entityManager, x, y, characterId) {
    const playerEntityId = entityManager.createEntity();



    const topLeftX = x - PLAYER_CONSTANTS.WIDTH / 2;
    const topLeftY = y - PLAYER_CONSTANTS.HEIGHT / 2;

    entityManager.addComponent(playerEntityId, new PositionComponent(topLeftX, topLeftY));
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
    entityManager.addComponent(playerEntityId, new DynamicColliderComponent());

    return playerEntityId;
}