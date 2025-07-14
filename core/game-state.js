export class GameState {
  constructor(levelSections) {
    this.levelSections = levelSections;
    this.currentSection = 0;
    this.currentLevelIndex = 0;
    this.levelProgress = this.loadProgress();
    this.showingLevelComplete = false;
  }

  bindDependencies({ player, soundManager, hud, pause, resume, loadLevel, getLevelStartTimeRef, getLevelTimeRef }) {
    this.player = player;
    this.soundManager = soundManager;
    this.hud = hud;
    this.pause = pause;
    this.resume = resume;
    this.loadLevel = loadLevel;

    // These are functions that return a reference, or you can use a setter
    this.getLevelStartTimeRef = getLevelStartTimeRef;
    this.getLevelTimeRef = getLevelTimeRef;
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

    this.soundManager.play('level_complete', 1.0);
    this.showingLevelComplete = true;
    this.pause();
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

    if (this.player) {
      this.player.needsRespawn = false;
    }

    // Reset timer when transitioning to next level
    if (action === 'next' || action === 'restart') {
      this.getLevelStartTimeRef().value = performance.now();
      this.getLevelTimeRef().value = 0;
    }
    
    if (action === 'next') {
      if (this.currentLevelIndex + 1 < this.levelSections[this.currentSection].length) {
        this.currentLevelIndex++;
        this.loadLevel(this.currentSection, this.currentLevelIndex);
      } else {
        if (this.currentSection + 1 < this.levelSections.length) {
          this.currentSection++;
          this.currentLevelIndex = 0;
          this.loadLevel(this.currentSection, this.currentLevelIndex);
          
          if (this.currentSection >= this.levelProgress.unlockedSections) {
            this.levelProgress.unlockedSections = this.currentSection + 1;
          }
        } else {
          console.log('Game completed!');
          return;
        }
      }

    } else if (action === 'restart') {
      this.restartLevel();

    } else if (action === 'previous') {
      if (this.currentLevelIndex > 0) {
        this.currentLevelIndex--;
        this.loadLevel(this.currentSection, this.currentLevelIndex);
      }
    }
    
    this.resume();
  }

  handleLevelCompleteClick(event) {
    if (!this.showingLevelComplete) return false;
    
    const action = this.hud.handleLevelCompleteClick(
      event, 
      this.hasNextLevel(),
      this.hasPreviousLevel()
    );
    
    if (action) {
      this.handleLevelCompleteAction(action);
      return true;
    }
    
    return false;
  }

  restartLevel() {
    this.loadLevel(this.currentSection, this.currentLevelIndex);
  }

}