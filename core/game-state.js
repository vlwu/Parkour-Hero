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
    // Initialize progress if it doesn't exist
    if (!this.gameProgress) {
      this.gameProgress = {
        unlockedSections: 1,
        unlockedLevels: [1],
        completedLevels: []
      };
    }
    
    return this.gameProgress;
  }

  saveProgress() {
    // Ensure levelProgress exists before saving
    if (!this.levelProgress) {
      this.levelProgress = {
        unlockedSections: 1,
        unlockedLevels: [1],
        completedLevels: []
      };
    }
    
    this.gameProgress = {
      unlockedSections: this.levelProgress.unlockedSections,
      unlockedLevels: this.levelProgress.unlockedLevels,
      completedLevels: this.levelProgress.completedLevels
    };
  }

  loadLevel(sectionIndex, levelIndex, Player, assets) {
    // Validate inputs
    if (!levelSections || !Array.isArray(levelSections)) {
      console.error('levelSections is not available or not an array');
      return false;
    }

    if (sectionIndex < 0 || sectionIndex >= levelSections.length) {
      console.error(`Invalid section index: ${sectionIndex}`);
      return false;
    }

    if (levelIndex < 0 || levelIndex >= levelSections[sectionIndex].length) {
      console.error(`Invalid level index: ${levelIndex} for section ${sectionIndex}`);
      return false;
    }

    try {
      this.currentSection = sectionIndex;
      this.currentLevelIndex = levelIndex;
      this.currentLevel = createLevel(levelSections[sectionIndex][levelIndex]);
      
      // Initialize fruits array safely
      this.fruits = this.currentLevel.fruits || [];
      this.fruitCount = 0;
      this.collectedFruits = [];
      
      // Create player with validation
      if (!Player) {
        console.error('Player class not provided');
        return false;
      }

      if (!this.currentLevel.startPosition) {
        console.error('Level has no start position');
        return false;
      }

      this.player = new Player(
        this.currentLevel.startPosition.x,
        this.currentLevel.startPosition.y,
        assets
      );
      
      if (this.player) {
        this.player.deathCount = 0;
      }
      
      console.log(`Loaded: ${this.currentLevel.name || 'Unnamed Level'}`);
      return true;
      
    } catch (error) {
      console.error('Error loading level:', error);
      return false;
    }
  }

  advanceLevel() {
    try {
      const levelId = `${this.currentSection}-${this.currentLevelIndex}`;
      
      // Ensure levelProgress exists
      if (!this.levelProgress) {
        this.levelProgress = {
          unlockedSections: 1,
          unlockedLevels: [1],
          completedLevels: []
        };
      }
      
      if (!this.levelProgress.completedLevels.includes(levelId)) {
        this.levelProgress.completedLevels.push(levelId);
      }
      
      this.showingLevelComplete = true;
      return true;
      
    } catch (error) {
      console.error('Error advancing level:', error);
      return false;
    }
  }

  hasNextLevel() {
    try {
      if (!levelSections || !Array.isArray(levelSections)) {
        return false;
      }
      
      return (this.currentLevelIndex + 1 < levelSections[this.currentSection].length) ||
             (this.currentSection + 1 < levelSections.length);
             
    } catch (error) {
      console.error('Error checking next level:', error);
      return false;
    }
  }

  goToNextLevel() {
    try {
      if (!levelSections || !Array.isArray(levelSections)) {
        return null;
      }
      
      if (this.currentLevelIndex + 1 < levelSections[this.currentSection].length) {
        this.currentLevelIndex++;
        return { section: this.currentSection, level: this.currentLevelIndex };
      } else if (this.currentSection + 1 < levelSections.length) {
        this.currentSection++;
        this.currentLevelIndex = 0;
        
        // Ensure levelProgress exists
        if (!this.levelProgress) {
          this.levelProgress = {
            unlockedSections: 1,
            unlockedLevels: [1],
            completedLevels: []
          };
        }
        
        if (this.currentSection >= this.levelProgress.unlockedSections) {
          this.levelProgress.unlockedSections = this.currentSection + 1;
        }
        
        return { section: this.currentSection, level: this.currentLevelIndex };
      }
      
      return null;
      
    } catch (error) {
      console.error('Error going to next level:', error);
      return null;
    }
  }

  restartLevel() {
    return { section: this.currentSection, level: this.currentLevelIndex };
  }

  handleLevelCompleteAction(action) {
    try {
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
      
    } catch (error) {
      console.error('Error handling level complete action:', error);
      return null;
    }
  }

  // Getters for current state with safety checks
  getCurrentLevel() { 
    return this.currentLevel; 
  }
  
  getPlayer() { 
    return this.player; 
  }
  
  getFruits() { 
    return this.fruits || []; 
  }
  
  getCollectedFruits() { 
    return this.collectedFruits || []; 
  }
  
  isShowingLevelComplete() { 
    return this.showingLevelComplete; 
  }
  
  // State setters with validation
  setCollectedFruits(fruits) { 
    this.collectedFruits = Array.isArray(fruits) ? fruits : []; 
  }
  
  setShowingLevelComplete(showing) { 
    this.showingLevelComplete = !!showing; 
  }
}