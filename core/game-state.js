import { characterConfig } from '../entities/levels.js';

function getLinearIndex(sectionIndex, levelIndex, levelSections) {
    let linearIndex = 0;
    for (let i = 0; i < sectionIndex; i++) {
        linearIndex += levelSections[i].levels.length;
    }
    linearIndex += levelIndex;
    return linearIndex;
}

export class GameState {
  constructor(levelSections, dependencies) {
      this.levelSections = levelSections;
      this.dependencies = dependencies; 
      
      this.currentSection = 0;
      this.currentLevelIndex = 0;
      this.showingLevelComplete = false;

      const savedState = this.loadProgress();
      this.levelProgress = savedState.levelProgress;
      this.selectedCharacter = savedState.selectedCharacter;
  }

  loadProgress() {
      try {
        const saved = localStorage.getItem('parkourGameState');
        if (saved) {
          const state = JSON.parse(saved);
          // Basic validation
          if (state.levelProgress && state.selectedCharacter) {
            return state;
          }
        }
      } catch (e) {
        console.error("Failed to load game state from localStorage", e);
      }

      // Default state if nothing is saved or loading fails
      return {
        levelProgress: {
          unlockedLevels: [1], 
          completedLevels: [], 
        },
        selectedCharacter: 'PinkMan',
      };
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
      const defaultState = this.loadProgress();
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
      const totalLevels = this.levelSections.reduce((acc, section) => acc + section.levels.length, 0);
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
          
          const totalLevels = this.levelSections.reduce((acc, section) => acc + section.levels.length, 0);
          const currentLinearIndex = getLinearIndex(this.currentSection, this.currentLevelIndex, this.levelSections);
          
          if (currentLinearIndex + 1 < totalLevels) {
              const nextUnlockedCount = currentLinearIndex + 2;
              if (nextUnlockedCount > this.levelProgress.unlockedLevels[0]) {
                  this.levelProgress.unlockedLevels[0] = nextUnlockedCount;
              }
          }
          this.saveProgress();
      }

      const { soundManager } = this.dependencies.getEngineState();
      soundManager.play('level_complete', 1.0);
      this.showingLevelComplete = true;
      this.dependencies.pause();
  }

  isLevelUnlocked(sectionIndex, levelIndex) {
      const levelLinearIndex = getLinearIndex(sectionIndex, levelIndex, this.levelSections);
      return levelLinearIndex < this.levelProgress.unlockedLevels[0];
  }

  isLevelCompleted(sectionIndex, levelIndex) {
      const levelId = `${sectionIndex}-${levelIndex}`;
      return this.levelProgress.completedLevels.includes(levelId);
  }


  hasNextLevel() {
    const hasNextInSection = this.currentLevelIndex + 1 < this.levelSections[this.currentSection].levels.length;
    const hasNextSection = this.currentSection + 1 < this.levelSections.length;
    return hasNextInSection || hasNextSection;
  }

  hasPreviousLevel() {
    return this.currentLevelIndex > 0 || this.currentSection > 0;
  }

  handleLevelCompleteAction(action) {
    this.showingLevelComplete = false;
    
    const { player } = this.dependencies.getEngineState();
    if (player) {
      player.needsRespawn = false;
    }
    
    const { loadLevel, resume } = this.dependencies;

    if (action === 'next') {
      if (this.currentLevelIndex + 1 < this.levelSections[this.currentSection].levels.length) {
        this.currentLevelIndex++;
      } else if (this.currentSection + 1 < this.levelSections.length) {
        this.currentSection++;
        this.currentLevelIndex = 0;
      }
      loadLevel(this.currentSection, this.currentLevelIndex);
    } else if (action === 'restart') {
      loadLevel(this.currentSection, this.currentLevelIndex);
    } else if (action === 'previous' && this.hasPreviousLevel()) {
      if (this.currentLevelIndex > 0) {
        this.currentLevelIndex--;
      } else if (this.currentSection > 0) {
        this.currentSection--;
        this.currentLevelIndex = this.levelSections[this.currentSection].levels.length - 1;
      }
      loadLevel(this.currentSection, this.currentLevelIndex);
    }
    
    resume();
  }

  handleLevelCompleteClick(x, y) {
    if (!this.showingLevelComplete) return false;
    
    const { hud } = this.dependencies.getEngineState();
    const action = hud.handleLevelCompleteClick(x, y, this.hasNextLevel(), this.hasPreviousLevel());
    
    if (action) {
      this.handleLevelCompleteAction(action);
      return true;
    }
    
    return false;
  }
}