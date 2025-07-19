import { eventBus } from '../utils/event-bus.js';
import { characterConfig } from '../entities/level-definitions.js';

export class CharacterMenu {
    constructor(gameState, assets, fontRenderer) {
        this.gameState = gameState;
        this.assets = assets;
        this.fontRenderer = fontRenderer;
        this.headerRendered = false;

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

    renderBitmapHeader() {
        if (!this.fontRenderer || this.headerRendered) return;
        
        const title = document.querySelector('#characterModal .modal-content h2');
        if (title && title.textContent) {
            const text = title.textContent;
            title.innerHTML = '';
            const canvas = this.fontRenderer.renderTextToCanvas(text, {
                scale: 3,
                color: 'white',
                outlineColor: 'black',
                outlineWidth: 1
            });
            if (canvas) {
                canvas.style.imageRendering = 'pixelated';
                title.appendChild(canvas);
                this.headerRendered = true;
            }
        }
    }

    show() {
        this.renderBitmapHeader();
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
    
            // 1. Preview Canvas
            const previewCanvas = document.createElement('canvas');
            previewCanvas.className = 'char-canvas';
            previewCanvas.dataset.charId = charId;
            previewCanvas.width = 64;
            previewCanvas.height = 64;

            // 2. Character Name
            const nameDiv = document.createElement('div');
            nameDiv.className = 'char-name';
            const charNameFormatted = charId.replace(/([A-Z])/g, ' $1').trim();
            const nameCanvas = this.fontRenderer.renderTextToCanvas(charNameFormatted, { scale: 2, color: 'white' });
            if(nameCanvas) {
                nameCanvas.style.imageRendering = 'pixelated';
                nameDiv.appendChild(nameCanvas);
            }

            // 3. Unlock Requirement Text
            const unlockDiv = document.createElement('div');
            unlockDiv.className = 'char-unlock';
            const config = characterConfig[charId];
            const unlockText = isUnlocked ? 'Available' : `Complete ${config.unlockRequirement} levels`;
            const unlockCanvas = this.fontRenderer.renderTextToCanvas(unlockText, { scale: 1.5, color: '#ccc' });
            if(unlockCanvas) {
                unlockCanvas.style.imageRendering = 'pixelated';
                unlockDiv.appendChild(unlockCanvas);
            }
            if (!isUnlocked) { // Add "to unlock" on a new line if locked
                const unlockSubCanvas = this.fontRenderer.renderTextToCanvas("to unlock", { scale: 1.5, color: '#ccc' });
                if (unlockSubCanvas) {
                    unlockSubCanvas.style.imageRendering = 'pixelated';
                    unlockDiv.appendChild(unlockSubCanvas);
                }
            }


            // 4. Action Button
            const selectButton = document.createElement('button');
            selectButton.className = 'action-button select-button';
            
            if (isUnlocked) {
                const buttonText = isSelected ? 'Selected' : 'Select';
                const buttonCanvas = this.fontRenderer.renderTextToCanvas(buttonText, { scale: 2, color: 'white' });
                if (buttonCanvas) {
                    buttonCanvas.style.imageRendering = 'pixelated';
                    selectButton.appendChild(buttonCanvas);
                }
                
                if (!isSelected) {
                    selectButton.addEventListener('click', () => {
                        eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
                        this.gameState.setSelectedCharacter(charId);
                        eventBus.publish('characterUpdated', charId);
                        this.populate();
                    });
                }
            } else {
                selectButton.disabled = true;
                const lockIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                lockIcon.setAttribute('class', 'lock-icon');
                lockIcon.setAttribute('viewBox', '0 0 24 24');
                lockIcon.innerHTML = `<path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"></path>`;
                
                const buttonCanvas = this.fontRenderer.renderTextToCanvas("Locked", { scale: 2, color: 'white' });
                selectButton.appendChild(lockIcon);
                if (buttonCanvas) {
                     buttonCanvas.style.imageRendering = 'pixelated';
                    selectButton.appendChild(buttonCanvas);
                }
            }

            card.append(previewCanvas, nameDiv, unlockDiv, selectButton);
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