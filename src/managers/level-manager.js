import { Level } from '../entities/level.js';
import { levelSections } from '../entities/level-definitions.js';
import { eventBus } from '../utils/event-bus.js';

export class LevelManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.levelSections = levelSections;

    eventBus.subscribe('requestNextLevel', () => this.goToNextLevel());
    eventBus.subscribe('requestPreviousLevel', () => this.goToPreviousLevel());
  }

  /**
   * Creates and returns a new Level instance based on the provided indices.
   * @param {number} sectionIndex - The index of the level section.
   * @param {number} levelIndex - The index of the level within the section.
   * @param {EntityManager} entityManager - The entity manager to be populated by the level.
   * @returns {Level|null} A new Level object or null if the indices are invalid.
   */
  loadLevel(sectionIndex, levelIndex, entityManager) {
    if (sectionIndex >= this.levelSections.length || levelIndex >= this.levelSections[sectionIndex].levels.length) {
      console.error(`Invalid level: Section ${sectionIndex}, Level ${levelIndex}`);
      return null;
    }

    const levelData = this.levelSections[sectionIndex].levels[levelIndex];
    if (!levelData) {
      console.error(`Failed to load level data for Section ${sectionIndex}, Level ${levelIndex}. The JSON file may be missing or failed to fetch.`);
      return null;
    }

    this.gameState.currentSection = sectionIndex;
    this.gameState.currentLevelIndex = levelIndex;

    return new Level(levelData, entityManager);
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

  handleLevelCompleteAction(action) {
    this.gameState.showingLevelComplete = false;
    let { currentSection, currentLevelIndex } = this.gameState;

    if (action === 'next' && this.hasNextLevel()) {
      if (currentLevelIndex + 1 < this.levelSections[currentSection].levels.length) {
        currentLevelIndex++;
      } else if (currentSection + 1 < this.levelSections.length) {
        currentSection++;
        currentLevelIndex = 0;
      }
      eventBus.publish('requestLevelLoad', { sectionIndex: currentSection, levelIndex: currentLevelIndex });
    } else if (action === 'restart') {
      eventBus.publish('requestLevelLoad', { sectionIndex: currentSection, levelIndex: currentLevelIndex });
    } else if (action === 'previous' && this.hasPreviousLevel()) {
      if (currentLevelIndex > 0) {
        currentLevelIndex--;
      } else if (currentSection > 0) {
        currentSection--;
        currentLevelIndex = this.levelSections[currentSection].levels.length - 1;
      }
      eventBus.publish('requestLevelLoad', { sectionIndex: currentSection, levelIndex: currentLevelIndex });
    }
  }
}