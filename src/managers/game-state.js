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

function getSectionAndLevelFromLinearIndex(linearIndex, levelSections) {
    let levelCount = 0;
    for (let i = 0; i < levelSections.length; i++) {
        const sectionLevelCount = levelSections[i].levels.length;
        if (linearIndex < levelCount + sectionLevelCount) {
            return { sectionIndex: i, levelIndex: linearIndex - levelCount };
        }
        levelCount += sectionLevelCount;
    }
    // Fallback if index is out of bounds (e.g., all levels completed)
    const lastSectionIndex = levelSections.length - 1;
    if (lastSectionIndex < 0) return { sectionIndex: 0, levelIndex: 0 };
    const lastLevelIndex = levelSections[lastSectionIndex].levels.length - 1;
    return { sectionIndex: lastSectionIndex, levelIndex: lastLevelIndex >= 0 ? lastLevelIndex : 0 };
}

export class GameState {
  constructor(initialState = null) {
      if (initialState) {
          this.currentSection = initialState.currentSection;
          this.currentLevelIndex = initialState.currentLevelIndex;
          this.showingLevelComplete = initialState.showingLevelComplete;
          this.levelProgress = initialState.levelProgress;
          this.selectedCharacter = initialState.selectedCharacter;
          this.levelStats = initialState.levelStats;
          this.tutorialShown = initialState.tutorialShown;
      } else {
          this.showingLevelComplete = false;
          const savedState = this.loadProgress();
          this.levelProgress = savedState.levelProgress;
          this.selectedCharacter = savedState.selectedCharacter;
          this.levelStats = savedState.levelStats;
          this.tutorialShown = savedState.tutorialShown;
          this.ensureStatsForAllLevels();

          // Determine the level to start/continue on.
          const lastUnlockedLinearIndex = this.levelProgress.unlockedLevels[0] - 1;
          const { sectionIndex, levelIndex } = getSectionAndLevelFromLinearIndex(lastUnlockedLinearIndex, levelSections);
          this.currentSection = sectionIndex;
          this.currentLevelIndex = levelIndex;
      }
  }

  _clone() {
      const clonedState = JSON.parse(JSON.stringify(this));
      return new GameState(clonedState);
  }

  _getDefaultState() {
    return {
      levelProgress: { unlockedLevels: [1], completedLevels: [] },
      selectedCharacter: 'PinkMan',
      levelStats: {},
      tutorialShown: false,
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
        if (!state.levelStats || typeof state.levelStats !== 'object') {
            state.levelStats = {};
        }
        if (typeof state.tutorialShown !== 'boolean') {
            state.tutorialShown = false;
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
          levelStats: this.levelStats,
          tutorialShown: this.tutorialShown,
        };
        localStorage.setItem('parkourGameState', JSON.stringify(stateToSave));
        console.log("Progress saved:", stateToSave);
      } catch (e) {
        console.error("Failed to save game state to localStorage", e);
      }
  }
  
  setSelectedCharacter(characterId) {
    if (characterConfig[characterId] && this.selectedCharacter !== characterId) {
      const newState = this._clone();
      newState.selectedCharacter = characterId;
      newState.saveProgress();
      return newState;
    }
    return this;
  }

  ensureStatsForAllLevels() {
    levelSections.forEach((section, sectionIndex) => {
        section.levels.forEach((_, levelIndex) => {
            const levelId = `${sectionIndex}-${levelIndex}`;
            if (!this.levelStats[levelId]) {
                this.levelStats[levelId] = {
                    fastestTime: null,
                    lowestDeaths: null,
                    totalAttempts: 0,
                };
            }
        });
    });
  }

  incrementAttempts(sectionIndex, levelIndex) {
    const newState = this._clone();
    const levelId = `${sectionIndex}-${levelIndex}`;
    if (newState.levelStats[levelId]) {
        newState.levelStats[levelId].totalAttempts += 1;
        newState.saveProgress();
    }
    return newState;
  }
  
  onLevelComplete(runStats) {
      const newState = this._clone();
      const levelId = `${this.currentSection}-${this.currentLevelIndex}`;

      if (!this.levelProgress.completedLevels.includes(levelId)) {
          newState.levelProgress.completedLevels.push(levelId);
          
          const totalLevels = levelSections.reduce((acc, section) => acc + section.levels.length, 0);
          const currentLinearIndex = getLinearIndex(this.currentSection, this.currentLevelIndex, levelSections);
          
          if (currentLinearIndex + 1 < totalLevels) {
              const nextUnlockedCount = currentLinearIndex + 2;
              if (nextUnlockedCount > this.levelProgress.unlockedLevels[0]) {
                  newState.levelProgress.unlockedLevels[0] = nextUnlockedCount;
              }
          }
      }

      const currentStats = newState.levelStats[levelId];
      if (currentStats) {
          if (currentStats.fastestTime === null || runStats.time < currentStats.fastestTime) {
              currentStats.fastestTime = runStats.time;
          }
          if (currentStats.lowestDeaths === null || runStats.deaths < currentStats.lowestDeaths) {
              currentStats.lowestDeaths = runStats.deaths;
          }
      }

      newState.showingLevelComplete = true;
      newState.saveProgress();
      eventBus.publish('playSound', { key: 'level_complete', volume: 1.0, channel: 'UI' });
      
      return newState;
  }

  isCharacterUnlocked(characterId) {
    const config = characterConfig[characterId];
    if (!config) return false;
    const completedCount = this.levelProgress.completedLevels.length;
    return completedCount >= config.unlockRequirement;
  }

  isLevelUnlocked(sectionIndex, levelIndex) {
      const levelLinearIndex = getLinearIndex(sectionIndex, levelIndex, levelSections);
      return levelLinearIndex < this.levelProgress.unlockedLevels[0];
  }

  isLevelCompleted(sectionIndex, levelIndex) {
      const levelId = `${sectionIndex}-${levelIndex}`;
      return this.levelProgress.completedLevels.includes(levelId);
  }
  
  resetProgress() {
    try {
      localStorage.removeItem('parkourGameState');
      const newState = new GameState(); // Creates a fresh state from defaults
      newState.saveProgress();
      return newState;
    } catch (e) {
      console.error("Failed to reset game state in localStorage", e);
      return this; // Return old state on failure
    }
  }
  
  markTutorialAsShown() {
      if (this.tutorialShown) return this;
      const newState = this._clone();
      newState.tutorialShown = true;
      newState.saveProgress();
      return newState;
  }
  
  unlockAllLevels() {
      const newState = this._clone();
      const totalLevels = levelSections.reduce((acc, section) => acc + section.levels.length, 0);
      newState.levelProgress.unlockedLevels[0] = totalLevels;
      
      // Mark all levels as completed to ensure characters are unlocked
      newState.levelProgress.completedLevels = [];
      levelSections.forEach((section, sIdx) => {
          section.levels.forEach((_, lIdx) => {
              newState.levelProgress.completedLevels.push(`${sIdx}-${lIdx}`);
          });
      });
      
      newState.saveProgress();
      return newState;
  }
}