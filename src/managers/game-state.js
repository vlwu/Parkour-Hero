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
  constructor() {
      this.currentSection = 0;
      this.currentLevelIndex = 0;
      this.showingLevelComplete = false;

      const savedState = this.loadProgress();
      this.levelProgress = savedState.levelProgress;
      this.selectedCharacter = savedState.selectedCharacter;
  }

  _getDefaultState() {
    return {
      levelProgress: {
        unlockedLevels: [1], 
        completedLevels: [], 
      },
      selectedCharacter: 'PinkMan',
    };
  }

  loadProgress() {
      try {
        const saved = localStorage.getItem('parkourGameState');
        if (!saved) {
          return this._getDefaultState();
        }

        const state = JSON.parse(saved);

        // Stricter validation for the parsed object
        if (typeof state !== 'object' || state === null) {
          console.warn('Saved game state is not an object. Resetting to default.');
          return this._getDefaultState();
        }

        const lp = state.levelProgress;
        if (typeof lp !== 'object' || lp === null || !Array.isArray(lp.unlockedLevels) || !Array.isArray(lp.completedLevels)) {
            console.warn('Saved levelProgress data is malformed. Resetting to default.');
            return this._getDefaultState();
        }

        if (typeof state.selectedCharacter !== 'string' || !characterConfig[state.selectedCharacter]) {
            console.warn(`Saved character "${state.selectedCharacter}" is invalid or no longer exists. Resetting to default character.`);
            state.selectedCharacter = 'PinkMan'; // Reset only the character, keep progress
        }

        return state;

      } catch (e) {
        console.error("Failed to parse game state from localStorage. Data may be corrupted. Resetting to default.", e);
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

  resetProgress() {
    try {
      localStorage.removeItem('parkourGameState');
      console.log("Game progress has been reset.");

      // Reload the default state
      const defaultState = this._getDefaultState();
      this.levelProgress = defaultState.levelProgress;
      this.selectedCharacter = defaultState.selectedCharacter;

      // Reset current level pointers
      this.currentSection = 0;
      this.currentLevelIndex = 0;

    } catch (e) {
      console.error("Failed to reset game state in localStorage", e);
    }
  }

  unlockAllLevels() {
      const totalLevels = levelSections.reduce((acc, section) => acc + section.levels.length, 0);
      this.levelProgress.unlockedLevels[0] = totalLevels;
      this.levelProgress.completedLevels = []; // Clear and...
      for (let i=0; i < totalLevels; i++) { // ...mock completion
          this.levelProgress.completedLevels.push(`temp-${i}`);
      }
      console.log(`%cAll ${totalLevels} levels have been unlocked!`, 'color: lightgreen; font-weight: bold;');
      this.saveProgress();
  }
  
  setSelectedCharacter(characterId) {
    if (characterConfig[characterId]) {
      this.selectedCharacter = characterId;
      this.saveProgress();
    }
  }
  
  isCharacterUnlocked(characterId) {
    const config = characterConfig[characterId];
    if (!config) return false;

    // The number of unique completed levels determines unlocks
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

      eventBus.publish('playSound', { key: 'level_complete', volume: 1.0 });
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