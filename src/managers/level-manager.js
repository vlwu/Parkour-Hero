import { Level } from '../entities/level.js';
import { levelSections } from '../entities/level-definitions.js';
import { eventBus } from '../utils/event-bus.js';

export class LevelManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.levelSections = levelSections;

    eventBus.subscribe('requestNextLevel', () => this.goToNextLevel());
    eventBus.subscribe('requestPreviousLevel', () => this.goToPreviousLevel());
    eventBus.subscribe('gameStateUpdated', (newGameState) => this.gameState = newGameState);
  }

  getLevelData(sectionIndex, levelIndex) {
    if (sectionIndex >= this.levelSections.length || levelIndex >= this.levelSections[sectionIndex].levels.length) {
      console.error(`Invalid level index: Section ${sectionIndex}, Level ${levelIndex}`);
      return null;
    }
    return this.levelSections[sectionIndex].levels[levelIndex];
  }

  loadLevel(sectionIndex, levelIndex) {
    const levelData = this.getLevelData(sectionIndex, levelIndex);
    if (!levelData) {
      console.error(`Failed to load level data for Section ${sectionIndex}, Level ${levelIndex}.`);
      return null;
    }

    this.gameState.currentSection = sectionIndex;
    this.gameState.currentLevelIndex = levelIndex;

    return new Level(levelData);
  }

  hasNextLevel() {
    const { currentSection, currentLevelIndex } = this.gameState;
    const hasNextInSection = currentLevelIndex + 1 < this.levelSections[currentSection].levels.length;
    const hasNextSection = currentSection + 1 < this.levelSections.length;
    return hasNextInSection || hasNextSection;
  }

  hasPreviousLevel() {
    const { currentSection, currentLevelIndex } = this.gameState;
    return currentLevelIndex > 0 || currentSection > 0;
  }

  goToNextLevel() {
      if (!this.hasNextLevel()) return;
      let { currentSection, currentLevelIndex } = this.gameState;
      if (currentLevelIndex + 1 < this.levelSections[currentSection].levels.length) {
          currentLevelIndex++;
      } else if (currentSection + 1 < this.levelSections.length) {
          currentSection++;
          currentLevelIndex = 0;
      }
      eventBus.publish('requestLevelLoad', { sectionIndex: currentSection, levelIndex: currentLevelIndex });
  }

  goToPreviousLevel() {
      if (!this.hasPreviousLevel()) return;
      let { currentSection, currentLevelIndex } = this.gameState;
      if (currentLevelIndex > 0) {
          currentLevelIndex--;
      } else if (currentSection > 0) {
          currentSection--;
          currentLevelIndex = this.levelSections[currentSection].levels.length - 1;
      }
      eventBus.publish('requestLevelLoad', { sectionIndex: currentSection, levelIndex: currentLevelIndex });
  }
}