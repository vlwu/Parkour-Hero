import { characterConfig } from '../entities/level-definitions.js';
import { eventBus } from '../utils/event-bus.js';
import { levelSections } from '../entities/level-definitions.js';

function getLinearIndex(sectionIndex, levelIndex, levelSections) {
    let linearIndex = 0;
    for (let i = 0; i < sectionIndex; i++) {
        linearIndex += levelSections[i].levels.length;
    }
    linearIndex += levelIndex;
    return linearIndex;
}

export class GameState {
  constructor(initialState = null) {
      if (initialState) {
          // Constructor for creating a new state from a previous one
          this.currentSection = initialState.currentSection;
          this.currentLevelIndex = initialState.currentLevelIndex;
          this.showingLevelComplete = initialState.showingLevelComplete;
          this.levelProgress = initialState.levelProgress;
          this.selectedCharacter = initialState.selectedCharacter;
      } else {
          // Constructor for the very first initialization
          this.currentSection = 0;
          this.currentLevelIndex = 0;
          this.showingLevelComplete = false;

          const savedState = this.loadProgress();
          this.levelProgress = savedState.levelProgress;
          this.selectedCharacter = savedState.selectedCharacter;
      }
  }

  // A private helper to create a new instance with the current state's data
  _clone() {
      return new GameState(this);
  }

  _getDefaultState() {
    return {
      levelProgress: { unlockedLevels: [1], completedLevels: [] },
      selectedCharacter: 'PinkMan',
    };
  }

  loadProgress() {
      try {
        const saved = localStorage.getItem('parkourGameState');
        if (!saved) return this._getDefaultState();
        const state = JSON.parse(saved);

        if (typeof state !== 'object' || state === null) return this._getDefaultState();
        const lp = state.levelProgress;
        if (typeof lp !== 'object' || lp === null || !Array.isArray(lp.unlockedLevels) || !Array.isArray(lp.completedLevels)) return this._getDefaultState();
        if (typeof state.selectedCharacter !== 'string' || !characterConfig[state.selectedCharacter]) {
            state.selectedCharacter = 'PinkMan';
        }
        return state;
      } catch (e) {
        console.error("Failed to parse game state from localStorage. Resetting to default.", e);
        return this._getDefaultState();
      }
  }

  saveProgress() {
      try {
        const stateToSave = {
          levelProgress: this.levelProgress,
          selectedCharacter: this.selectedCharacter,
        };
        localStorage.setItem('parkourGameState', JSON.stringify(stateToSave));
        console.log("Progress saved:", stateToSave);
      } catch (e) {
        console.error("Failed to save game state to localStorage", e);
      }
  }
  
  setSelectedCharacter(characterId) {
    if (characterConfig[characterId] && this.selectedCharacter !== characterId) {
      const newState = this._clone(); // Create a new instance with current data
      newState.selectedCharacter = characterId; // Modify the new instance
      newState.saveProgress(); // The new instance saves itself
      return newState; // Return the new instance
    }
    return this; // Return the original instance if no change occurred
  }

  isCharacterUnlocked(characterId) {
    const config = characterConfig[characterId];
    if (!config) return false;

    const completedCount = this.levelProgress.completedLevels.length;
    return completedCount >= config.unlockRequirement;
  }

  onLevelComplete() {
      const levelId = `${this.currentSection}-${this.currentLevelIndex}`;
      if (!this.levelProgress.completedLevels.includes(levelId)) {
          this.levelProgress.completedLevels.push(levelId);
          
          const totalLevels = levelSections.reduce((acc, section) => acc + section.levels.length, 0);
          const currentLinearIndex = getLinearIndex(this.currentSection, this.currentLevelIndex, levelSections);
          
          if (currentLinearIndex + 1 < totalLevels) {
              const nextUnlockedCount = currentLinearIndex + 2;
              if (nextUnlockedCount > this.levelProgress.unlockedLevels[0]) {
                  this.levelProgress.unlockedLevels[0] = nextUnlockedCount;
              }
          }
          this.saveProgress();
      }

      eventBus.publish('playSound', { key: 'level_complete', volume: 1.0, channel: 'UI' });
      this.showingLevelComplete = true;
      eventBus.publish('requestPause');
  }

  isLevelUnlocked(sectionIndex, levelIndex) {
      const levelLinearIndex = getLinearIndex(sectionIndex, levelIndex, levelSections);
      return levelLinearIndex < this.levelProgress.unlockedLevels[0];
  }

  isLevelCompleted(sectionIndex, levelIndex) {
      const levelId = `${sectionIndex}-${levelIndex}`;
      return this.levelProgress.completedLevels.includes(levelId);
  }
  
}