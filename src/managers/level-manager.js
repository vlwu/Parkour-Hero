import { Level } from '../entities/level.js';
import { levelSections } from '../entities/level-definitions.js';
import { eventBus } from '../utils/event-bus.js';

export class LevelManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.levelSections = levelSections;
    this.loadDIYLevels();

    eventBus.subscribe('requestNextLevel', () => this.goToNextLevel());
    eventBus.subscribe('requestPreviousLevel', () => this.goToPreviousLevel());
    eventBus.subscribe('gameStateUpdated', (newGameState) => this.gameState = newGameState);
    eventBus.subscribe('deleteDIYLevel', ({ levelIndex }) => this.deleteDIYLevel(levelIndex));
  }

  loadDIYLevels() {
    try {
      const diyLevelsJSON = localStorage.getItem('parkourHeroDIYLevels');
      if (diyLevelsJSON) {
        const diyLevels = JSON.parse(diyLevelsJSON);
        const diySection = this.levelSections.find(section => section.name === 'DIY');
        if (diySection && Array.isArray(diyLevels)) {
          diySection.levels = diyLevels;
        }
      }
    } catch (e) {
      console.error("Failed to load or parse DIY levels from localStorage", e);
    }
  }

  deleteDIYLevel(levelIndex) {
    try {
        const diyLevelsJSON = localStorage.getItem('parkourHeroDIYLevels');
        if (diyLevelsJSON) {
            const diyLevels = JSON.parse(diyLevelsJSON);
            if (Array.isArray(diyLevels) && levelIndex >= 0 && levelIndex < diyLevels.length) {
                diyLevels.splice(levelIndex, 1);
                localStorage.setItem('parkourHeroDIYLevels', JSON.stringify(diyLevels));

                const diySection = this.levelSections.find(section => section.name === 'DIY');
                if (diySection) {
                    diySection.levels.splice(levelIndex, 1);
                }
                
                eventBus.publish('gameStateUpdated', this.gameState._clone());
            }
        }
    } catch (e) {
        console.error("Failed to delete DIY level from localStorage", e);
    }
  }

  async getLevelData(sectionIndex, levelIndex) {
    if (sectionIndex >= this.levelSections.length || levelIndex >= this.levelSections[sectionIndex].levels.length) {
      console.error(`Invalid level index: Section ${sectionIndex}, Level ${levelIndex}`);
      return null;
    }

    let levelEntry = this.levelSections[sectionIndex].levels[levelIndex];

    if (levelEntry && typeof levelEntry.jsonPath === 'string') {
        try {
            const response = await fetch(levelEntry.jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch level: ${levelEntry.jsonPath}, status: ${response.status}`);
            }
            const levelData = await response.json();

            this.levelSections[sectionIndex].levels[levelIndex] = levelData;
            return levelData;
        } catch (error) {
            console.error(`Error loading level JSON from ${levelEntry.jsonPath}:`, error);
            return null;
        }
    }

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
    
    if (currentLevelIndex + 1 < this.levelSections[currentSection].levels.length) {
        return true;
    }

    // Safely look ahead for the next valid section
    for (let nextSectionIndex = currentSection + 1; nextSectionIndex < this.levelSections.length; nextSectionIndex++) {
        const nextSection = this.levelSections[nextSectionIndex];
        if (nextSection.name !== 'DIY' && nextSection.levels.length > 0) {
            return true;
        }
    }
    
    return false;
  }

  hasPreviousLevel() {
    const { currentSection, currentLevelIndex } = this.gameState;
    if (currentLevelIndex > 0) return true;
    
    // Safely look backwards for a valid section
    for (let prevSectionIndex = currentSection - 1; prevSectionIndex >= 0; prevSectionIndex--) {
        const prevSection = this.levelSections[prevSectionIndex];
        if (prevSection.name !== 'DIY' && prevSection.levels.length > 0) {
            return true;
        }
    }
    return false;
  }

  goToNextLevel() {
      if (!this.hasNextLevel()) return;
      let { currentSection, currentLevelIndex } = this.gameState;
      
      if (currentLevelIndex + 1 < this.levelSections[currentSection].levels.length) {
          currentLevelIndex++;
      } else {
          // Safely jump to the next valid section
          for (let nextSectionIndex = currentSection + 1; nextSectionIndex < this.levelSections.length; nextSectionIndex++) {
              const nextSection = this.levelSections[nextSectionIndex];
              if (nextSection.name !== 'DIY' && nextSection.levels.length > 0) {
                  currentSection = nextSectionIndex;
                  currentLevelIndex = 0;
                  break;
              }
          }
      }
      eventBus.publish('requestLevelLoad', { sectionIndex: currentSection, levelIndex: currentLevelIndex });
  }

  goToPreviousLevel() {
      if (!this.hasPreviousLevel()) return;
      let { currentSection, currentLevelIndex } = this.gameState;
      
      if (currentLevelIndex > 0) {
          currentLevelIndex--;
      } else {
          // Safely jump to the end of the previous valid section
          for (let prevSectionIndex = currentSection - 1; prevSectionIndex >= 0; prevSectionIndex--) {
              const prevSection = this.levelSections[prevSectionIndex];
              if (prevSection.name !== 'DIY' && prevSection.levels.length > 0) {
                  currentSection = prevSectionIndex;
                  currentLevelIndex = prevSection.levels.length - 1;
                  break;
              }
          }
      }
      eventBus.publish('requestLevelLoad', { sectionIndex: currentSection, levelIndex: currentLevelIndex });
  }
}