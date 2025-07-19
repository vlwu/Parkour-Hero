import { eventBus } from '../utils/event-bus.js';
import { characterConfig } from '../entities/level-definitions.js';

export class CharacterMenu {
    constructor(gameState, assets) {
        this.gameState = gameState;
        this.assets = assets;

        this.characterModal = document.getElementById('characterModal');
        this.characterSelectionContainer = document.getElementById('character-selection-container');
        this.characterPreviewAnimationId = null;
        this.characterPreviewStates = {};

        eventBus.subscribe('gameStateUpdated', (newGameState) => {
            this.gameState = newGameState;
            if (!this.characterModal.classList.contains('hidden')) {
                this.populate();
            }
        });
    }

    show() {
        this.populate();
        if (!this.characterPreviewAnimationId) {
            this.characterPreviewAnimationId = requestAnimationFrame(t => this.animateCharacterPreviews(t));
        }
    }

    hide() {
        if (this.characterPreviewAnimationId) {
            cancelAnimationFrame(this.characterPreviewAnimationId);
            this.characterPreviewAnimationId = null;
        }
    }

    populate() {
        if (!this.characterSelectionContainer) return;
        this.characterSelectionContainer.innerHTML = ''; 
        const availableCharacters = Object.keys(this.assets.characters);
    
        availableCharacters.forEach(charId => {
            const card = document.createElement('div');
            card.className = 'character-card';
            const isUnlocked = this.gameState.isCharacterUnlocked(charId);
            const isSelected = this.gameState.selectedCharacter === charId;
            
            if (!isUnlocked) card.classList.add('locked');
            if (isSelected) card.classList.add('selected');
    
            const charNameFormatted = charId.replace(/([A-Z])/g, ' $1').trim();
            const config = characterConfig[charId];
            const unlockText = isUnlocked ? 'Available' : `Complete ${config.unlockRequirement} levels to unlock`;
            let buttonContent = isSelected ? 'Selected' : 'Select';
            if (!isUnlocked) {
                buttonContent = `<svg class="lock-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"></path></svg> Locked`;
            }
    
            card.innerHTML = `
                <canvas class="char-canvas" data-char-id="${charId}" width="64" height="64"></canvas>
                <div class="char-name">${charNameFormatted}</div>
                <div class.char-unlock">${unlockText}</div>
                <button class="action-button select-button">${buttonContent}</button>
            `;
            const selectButton = card.querySelector('.select-button');
            if (!isUnlocked) {
                selectButton.disabled = true;
            } else {
                selectButton.addEventListener('click', () => {
                    if (isSelected) return;
                    eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
                    this.gameState.setSelectedCharacter(charId);
                    eventBus.publish('characterUpdated', charId);
                    this.populate();
                });
            }
            this.characterSelectionContainer.appendChild(card);
        });
    }
  
    animateCharacterPreviews(timestamp) {
        if (this.characterModal.classList.contains('hidden')) {
            this.hide();
            return;
        }

        const previewCanvases = this.characterSelectionContainer.querySelectorAll('.char-canvas');
        previewCanvases.forEach(canvas => {
            const charId = canvas.dataset.charId;
            if (!charId) return;
            if (!this.characterPreviewStates[charId]) {
                this.characterPreviewStates[charId] = { frame: 0, timer: 0, lastTime: timestamp };
            }
            const state = this.characterPreviewStates[charId];
            const idleSprite = this.assets.characters[charId]?.playerIdle;
            const ctx = canvas.getContext('2d');
            if (!idleSprite || !ctx) return;
            const deltaTime = (timestamp - state.lastTime) / 1000;
            state.lastTime = timestamp;
            state.timer += deltaTime;
            const animationSpeed = 0.08, frameCount = 11, frameWidth = idleSprite.width / frameCount;
            if (state.timer >= animationSpeed) {
                state.timer = 0;
                state.frame = (state.frame + 1) % frameCount;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(idleSprite, state.frame * frameWidth, 0, frameWidth, idleSprite.height, 0, 0, canvas.width, canvas.height);
        });

        this.characterPreviewAnimationId = requestAnimationFrame(t => this.animateCharacterPreviews(t));
    }
}