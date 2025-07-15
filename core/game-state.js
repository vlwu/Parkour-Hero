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
      // For persistence, this could use localStorage
      const savedProgress = {
          unlockedLevels: [1], // Track total number of unlocked levels
          completedLevels: [], // Track IDs of completed levels e.g., "0-0"
      };
      return savedProgress;
  }

  saveProgress() {
      // For persistence, this could use localStorage.setItem
      console.log("Progress saved:", this.levelProgress);
  }

  unlockAllLevels() {
      const totalLevels = this.levelSections.reduce((acc, section) => acc + section.length, 0);
      this.levelProgress.unlockedLevels[0] = totalLevels;
      console.log(`%cAll ${totalLevels} levels have been unlocked!`, 'color: lightgreen; font-weight: bold;');
      this.saveProgress();
  }

  onLevelComplete() {
      const levelId = `${this.currentSection}-${this.currentLevelIndex}`;
      if (!this.levelProgress.completedLevels.includes(levelId)) {
          this.levelProgress.completedLevels.push(levelId);

          // Unlock the next level if it exists
          const nextLevelLinearIndex = (this.currentSection * this.levelSections[0].length) + this.currentLevelIndex + 2;
          if (nextLevelLinearIndex > this.levelProgress.unlockedLevels[0]) {
              this.levelProgress.unlockedLevels[0] = nextLevelLinearIndex;
          }
          this.saveProgress();
      }

      const { soundManager } = this.dependencies.getEngineState();
      soundManager.play('level_complete', 1.0);
      this.showingLevelComplete = true;
      this.dependencies.pause();
  }

  // Check if a level is available to be played
  isLevelUnlocked(sectionIndex, levelIndex) {
      const levelLinearIndex = (sectionIndex * this.levelSections[0].length) + levelIndex + 1;
      return levelLinearIndex <= this.levelProgress.unlockedLevels[0];
  }

  // Check if a level has been successfully completed
  isLevelCompleted(sectionIndex, levelIndex) {
      const levelId = `${sectionIndex}-${levelIndex}`;
      return this.levelProgress.completedLevels.includes(levelId);
  }


  hasNextLevel() {
    return (this.currentLevelIndex + 1 < this.levelSections[this.currentSection].length) ||
          (this.currentSection + 1 < this.levelSections.length);
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
      if (this.currentLevelIndex + 1 < this.levelSections[this.currentSection].length) {
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
        this.currentLevelIndex = this.levelSections[this.currentSection].length - 1;
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