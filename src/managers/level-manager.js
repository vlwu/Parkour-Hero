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

  async getLevelData(sectionIndex, levelIndex) {
    if (sectionIndex >= this.levelSections.length || levelIndex >= this.levelSections[sectionIndex].levels.length) {
      console.error(`Invalid level index: Section ${sectionIndex}, Level ${levelIndex}`);
      return null;
    }

    let levelEntry = this.levelSections[sectionIndex].levels[levelIndex];

    // Check if the level data is just a path (not yet loaded)
    if (levelEntry && typeof levelEntry.jsonPath === 'string') {
        try {
            const response = await fetch(levelEntry.jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch level: ${levelEntry.jsonPath}, status: ${response.status}`);
            }
            const levelData = await response.json();
            // Cache the loaded data by replacing the path object
            this.levelSections[sectionIndex].levels[levelIndex] = levelData;
            return levelData;
        } catch (error) {
            console.error(`Error loading level JSON from ${levelEntry.jsonPath}:`, error);
            return null; // Or handle the error appropriately
        }
    }

    // If it's not a path, the data is already loaded and cached
    return levelEntry;
  }

  async loadLevel(sectionIndex, levelIndex) {
    const levelData = await this.getLevelData(sectionIndex, levelIndex);
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