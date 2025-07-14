export class GameState {
  constructor(levelSections, dependencies) {
      this.levelSections = levelSections;
      this.dependencies = dependencies; // Store the dependencies object
      
      this.currentSection = 0;
      this.currentLevelIndex = 0;
      this.levelProgress = this.loadProgress();
      this.showingLevelComplete = false;
  }

  loadProgress() {
    if (this.gameProgress) {
      return this.gameProgress;
    }
    this.gameProgress = {
      unlockedSections: 1,
      unlockedLevels: [1],
      completedLevels: []
    };
    return this.gameProgress;
  }

  saveProgress() {
    this.gameProgress = {
      unlockedSections: this.levelProgress.unlockedSections,
      unlockedLevels: this.levelProgress.unlockedLevels,
      completedLevels: this.levelProgress.completedLevels
    };
  }

  advanceLevel() {
    const levelId = `${this.currentSection}-${this.currentLevelIndex}`;
    if (!this.levelProgress.completedLevels.includes(levelId)) {
      this.levelProgress.completedLevels.push(levelId);
    }

    const { soundManager } = this.dependencies.getEngineState();
    soundManager.play('level_complete', 1.0);
    this.showingLevelComplete = true;
    this.dependencies.pause();
  }

  hasNextLevel() {
    return (this.currentLevelIndex + 1 < this.levelSections[this.currentSection].length) ||
          (this.currentSection + 1 < this.levelSections.length);
  }

  hasPreviousLevel() {
    return this.currentLevelIndex > 0;
  }

  handleLevelCompleteAction(action) {
    this.showingLevelComplete = false;
    
    const { player } = this.dependencies.getEngineState();
    if (player) {
      player.needsRespawn = false;
    }
    
    const { loadLevel, resume } = this.dependencies;

    if (action === 'next') {
      if (this.currentLevelIndex + 1 < this.levelSections[this.currentSection].length) {
        this.currentLevelIndex++;
        loadLevel(this.currentSection, this.currentLevelIndex);
      } else if (this.currentSection + 1 < this.levelSections.length) {
        this.currentSection++;
        this.currentLevelIndex = 0;
        loadLevel(this.currentSection, this.currentLevelIndex);
        if (this.currentSection >= this.levelProgress.unlockedSections) {
          this.levelProgress.unlockedSections = this.currentSection + 1;
        }
      } else {
        console.log('Game completed!');
      }
    } else if (action === 'restart') {
      loadLevel(this.currentSection, this.currentLevelIndex);
    } else if (action === 'previous' && this.hasPreviousLevel()) {
      this.currentLevelIndex--;
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