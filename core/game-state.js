// core/game-state.js
import { createLevel } from '../entities/platform.js';
import { levelSections } from '../entities/levels.js';

export class GameState {
  constructor() {
    this.currentSection = 0;
    this.currentLevelIndex = 0;
    this.currentLevel = null;
    this.player = null;
    this.fruits = [];
    this.collectedFruits = [];
    this.fruitCount = 0;
    this.showingLevelComplete = false;
    this.levelProgress = this.loadProgress();
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

  loadLevel(sectionIndex, levelIndex, Player, assets) {
    if (sectionIndex >= levelSections.length || 
        levelIndex >= levelSections[sectionIndex].length) {
      console.error(`Invalid level: Section ${sectionIndex}, Level ${levelIndex}`);
      return false;
    }

    this.currentSection = sectionIndex;
    this.currentLevelIndex = levelIndex;
    this.currentLevel = createLevel(levelSections[sectionIndex][levelIndex]);
    this.fruits = this.currentLevel.fruits;
    this.fruitCount = 0;
    this.collectedFruits = [];
    
    this.player = new Player(
      this.currentLevel.startPosition.x,
      this.currentLevel.startPosition.y,
      assets
    );
    this.player.deathCount = 0;
    
    console.log(`Loaded: ${this.currentLevel.name}`);
    return true;
  }

  advanceLevel() {
    const levelId = `${this.currentSection}-${this.currentLevelIndex}`;
    if (!this.levelProgress.completedLevels.includes(levelId)) {
      this.levelProgress.completedLevels.push(levelId);
    }
    this.showingLevelComplete = true;
    return true;
  }

  hasNextLevel() {
    return (this.currentLevelIndex + 1 < levelSections[this.currentSection].length) ||
           (this.currentSection + 1 < levelSections.length);
  }

  goToNextLevel() {
    if (this.currentLevelIndex + 1 < levelSections[this.currentSection].length) {
      this.currentLevelIndex++;
      return { section: this.currentSection, level: this.currentLevelIndex };
    } else if (this.currentSection + 1 < levelSections.length) {
      this.currentSection++;
      this.currentLevelIndex = 0;
      
      if (this.currentSection >= this.levelProgress.unlockedSections) {
        this.levelProgress.unlockedSections = this.currentSection + 1;
      }
      
      return { section: this.currentSection, level: this.currentLevelIndex };
    }
    return null;
  }

  restartLevel() {
    return { section: this.currentSection, level: this.currentLevelIndex };
  }

  handleLevelCompleteAction(action) {
    this.showingLevelComplete = false;
    
    if (this.player) {
      this.player.needsRespawn = false;
    }
    
    if (action === 'next') {
      return this.goToNextLevel();
    } else if (action === 'restart') {
      return this.restartLevel();
    }
    
    return null;
  }

  // Getters for current state
  getCurrentLevel() { return this.currentLevel; }
  getPlayer() { return this.player; }
  getFruits() { return this.fruits; }
  getCollectedFruits() { return this.collectedFruits; }
  isShowingLevelComplete() { return this.showingLevelComplete; }
  
  // State setters
  setCollectedFruits(fruits) { this.collectedFruits = fruits; }
  setShowingLevelComplete(showing) { this.showingLevelComplete = showing; }
}