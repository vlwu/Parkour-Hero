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
          this.currentSection = initialState.currentSection;
          this.currentLevelIndex = initialState.currentLevelIndex;
          this.showingLevelComplete = initialState.showingLevelComplete;
          this.levelProgress = initialState.levelProgress;
          this.selectedCharacter = initialState.selectedCharacter;
          this.levelStats = initialState.levelStats;
      } else {
          this.currentSection = 0;
          this.currentLevelIndex = 0;
          this.showingLevelComplete = false;
          const savedState = this.loadProgress();
          this.levelProgress = savedState.levelProgress;
          this.selectedCharacter = savedState.selectedCharacter;
          this.levelStats = savedState.levelStats;
          this.ensureStatsForAllLevels();
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
    const levelId = `${sectionIndex}-${levelIndex}`;
    if (this.levelStats[levelId]) {
        this.levelStats[levelId].totalAttempts += 1;
        this.saveProgress();
    }
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
      const defaultState = this._getDefaultState();
      this.levelProgress = defaultState.levelProgress;
      this.selectedCharacter = defaultState.selectedCharacter;
      this.levelStats = defaultState.levelStats;
      this.currentSection = 0;
      this.currentLevelIndex = 0;
      this.ensureStatsForAllLevels();
    } catch (e) {
      console.error("Failed to reset game state in localStorage", e);
    }
  }
  
  unlockAllLevels() {
      const totalLevels = levelSections.reduce((acc, section) => acc + section.levels.length, 0);
      this.levelProgress.unlockedLevels[0] = totalLevels;
      this.levelProgress.completedLevels = Array.from({length: totalLevels}, (_, i) => `temp-${i}`);
      this.saveProgress();
  }
}