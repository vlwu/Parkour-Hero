import { eventBus } from '../utils/event-bus.js';
import { levelSections } from '../entities/level-definitions.js';

export class LevelMenu {
    constructor(gameState) {
        this.gameState = gameState;
        this.levelSelectionContainer = document.getElementById('level-selection-container');
        
        eventBus.subscribe('gameStateUpdated', (newGameState) => {
            this.gameState = newGameState;
            this.populate();
        });
    }

    show() {
        this.populate();
    }

    populate() {
        if (!this.levelSelectionContainer) return;
        this.levelSelectionContainer.innerHTML = '';
  
        levelSections.forEach((section, sectionIndex) => {
            const sectionContainer = document.createElement('div');
            sectionContainer.classList.add('level-section-menu');
            const sectionTitle = document.createElement('h4');
            sectionTitle.textContent = section.name;
            sectionContainer.appendChild(sectionTitle);
            const levelGrid = document.createElement('div');
            levelGrid.classList.add('level-grid');
            
            section.levels.forEach((_, levelIndex) => {
                const button = document.createElement('button');
                button.textContent = `${levelIndex + 1}`;
                button.classList.add('level-button');
                const isUnlocked = this.gameState.isLevelUnlocked(sectionIndex, levelIndex);
                
                if (isUnlocked) {
                    if (this.gameState.isLevelCompleted(sectionIndex, levelIndex)) button.classList.add('completed');
                    if (this.gameState.currentSection === sectionIndex && this.gameState.currentLevelIndex === levelIndex) button.classList.add('current');
                    button.addEventListener('click', () => {
                        eventBus.publish('playSound', { key: 'button_click', volume: 0.8 });
                        eventBus.publish('requestLevelLoad', { sectionIndex, levelIndex });
                    });
                } else {
                    button.classList.add('locked');
                    button.disabled = true;
                    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"></path></svg>`;
                }
                levelGrid.appendChild(button);
            });
            sectionContainer.appendChild(levelGrid);
            this.levelSelectionContainer.appendChild(sectionContainer);
        });
    }
}