import { InputComponent } from '../components/InputComponent.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';
import { inputState } from '../systems/input-state.js';

export class InputSystemProcessor {
    /**
     * Processes the global input state and maps it to an InputComponent
     * for any entity that is player-controlled.
     */
    update(dt, { entityManager, keybinds, isRunning, gameState }) {
        // Only process gameplay input if the game is running and not in a menu/modal.
        const canProcessGameplayInput = isRunning && !gameState.showingLevelComplete;

        const entities = entityManager.query([PlayerControlledComponent, InputComponent]);
        for (const entityId of entities) {
            const inputComp = entityManager.getComponent(entityId, InputComponent);
            
            inputComp.moveLeft = canProcessGameplayInput && inputState.isKeyDown(keybinds.moveLeft);
            inputComp.moveRight = canProcessGameplayInput && inputState.isKeyDown(keybinds.moveRight);
            inputComp.jump = canProcessGameplayInput && inputState.isKeyDown(keybinds.jump);
            inputComp.dash = canProcessGameplayInput && inputState.isKeyDown(keybinds.dash);
        }
    }
}