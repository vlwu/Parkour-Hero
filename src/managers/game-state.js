import { characterConfig } from '../entities/level-definitions.js';
import { eventBus } from '../utils/event-bus.js';
import { levelSections } from '../entities/level-definitions.js';

function getLinearIndex(sectionIndex, levelIndex, levelSections) {
    let linearIndex = 0;
    for (let i = 0; i < sectionIndex; i++) {
        linearIndex += levelSections[i].levels.length;
    }
    linearIndex += levelIndex;
    return linearIndex;
}

function getSectionAndLevelFromLinearIndex(linearIndex, levelSections) {
    let levelCount = 0;
    for (let i = 0; i < levelSections.length; i++) {
        const sectionLevelCount = levelSections[i].levels.length;
        if (linearIndex < levelCount + sectionLevelCount) {
            return { sectionIndex: i, levelIndex: linearIndex - levelCount };
        }
        levelCount += sectionLevelCount;
    }

    const lastSectionIndex = levelSections.length - 1;
    if (lastSectionIndex < 0) return { sectionIndex: 0, levelIndex: 0 };
    const lastLevelIndex = levelSections[lastSectionIndex].levels.length - 1;
    return { sectionIndex: lastSectionIndex, levelIndex: lastLevelIndex >= 0 ? lastLevelIndex : 0 };
}

export class GameState {
  constructor(initialState) {
    this.currentSection = initialState.currentSection;
    this.currentLevelIndex = initialState.currentLevelIndex;
    this.showingLevelComplete = initialState.showingLevelComplete;
    this.levelProgress = initialState.levelProgress;
    this.selectedCharacter = initialState.selectedCharacter;
    this.levelStats = initialState.levelStats;
    this.tutorialShown = initialState.tutorialShown;
  }
}

class GameStateManager {
    constructor() {
        this.state = null;
        this.loadProgress();
        this._subscribeToEvents();
    }

    _subscribeToEvents() {
        eventBus.subscribe('levelComplete', (runStats) => this.onLevelComplete(runStats));
        eventBus.subscribe('setSelectedCharacter', (characterId) => this.setSelectedCharacter(characterId));
        eventBus.subscribe('incrementAttempts', ({ sectionIndex, levelIndex }) => this.incrementAttempts(sectionIndex, levelIndex));
        eventBus.subscribe('markTutorialAsShown', () => this.markTutorialAsShown());
        eventBus.subscribe('resetProgress', () => this.resetProgress());
        eventBus.subscribe('unlockAllLevels', () => this.unlockAllLevels());
        eventBus.subscribe('requestLevelLoad', ({ sectionIndex, levelIndex }) => this.setCurrentLevel(sectionIndex, levelIndex));
    }

    setCurrentLevel(sectionIndex, levelIndex) {
        if (this.state.currentSection !== sectionIndex || this.state.currentLevelIndex !== levelIndex) {
            const newStateData = this._cloneState();
            newStateData.currentSection = sectionIndex;
            newStateData.currentLevelIndex = levelIndex;
            this.state = new GameState(newStateData);
            eventBus.publish('gameStateUpdated', this.state);
        }
    }

    getState() {
        return this.state;
    }

    _cloneState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    _getDefaultState() {
        return {
            levelProgress: { unlockedLevelsCount: 1, completedLevels: [] },
            selectedCharacter: 'PinkMan',
            levelStats: {},
            tutorialShown: false,
        };
    }

    loadProgress() {
        let loadedState;
        try {
            const saved = localStorage.getItem('parkourGameState');
            if (!saved) {
                loadedState = this._getDefaultState();
            } else {
                const parsed = JSON.parse(saved);
                if (typeof parsed !== 'object' || parsed === null) throw new Error("Invalid saved state.");

                const lp = parsed.levelProgress;
                if (typeof lp !== 'object' || lp === null || !Array.isArray(lp.completedLevels)) throw new Error("Invalid level progress.");

                if (lp.unlockedLevels && Array.isArray(lp.unlockedLevels)) {
                    lp.unlockedLevelsCount = lp.unlockedLevels[0];
                    delete lp.unlockedLevels;
                }
                if (typeof lp.unlockedLevelsCount !== 'number' || lp.unlockedLevelsCount < 1) {
                    lp.unlockedLevelsCount = 1;
                }

                if (typeof parsed.selectedCharacter !== 'string' || !characterConfig[parsed.selectedCharacter]) parsed.selectedCharacter = 'PinkMan';
                if (!parsed.levelStats || typeof parsed.levelStats !== 'object') parsed.levelStats = {};
                if (typeof parsed.tutorialShown !== 'boolean') parsed.tutorialShown = false;

                loadedState = parsed;
            }
        } catch (e) {
            console.error("Failed to parse game state from localStorage. Resetting to default.", e);
            loadedState = this._getDefaultState();
        }

        this._ensureStatsForAllLevels(loadedState);
        const lastUnlockedLinearIndex = loadedState.levelProgress.unlockedLevelsCount - 1;
        const { sectionIndex, levelIndex } = getSectionAndLevelFromLinearIndex(lastUnlockedLinearIndex, levelSections);
        loadedState.currentSection = sectionIndex;
        loadedState.currentLevelIndex = levelIndex;
        loadedState.showingLevelComplete = false;

        this.state = new GameState(loadedState);
        eventBus.publish('gameStateUpdated', this.state);
    }

    saveProgress() {
        try {
            const stateToSave = {
                levelProgress: this.state.levelProgress,
                selectedCharacter: this.state.selectedCharacter,
                levelStats: this.state.levelStats,
                tutorialShown: this.state.tutorialShown,
            };
            localStorage.setItem('parkourGameState', JSON.stringify(stateToSave));
        } catch (e) {
            console.error("Failed to save game state to localStorage", e);
        }
    }

    _ensureStatsForAllLevels(state) {
        levelSections.forEach((section, sectionIndex) => {
            section.levels.forEach((_, levelIndex) => {
                const levelId = `${sectionIndex}-${levelIndex}`;
                if (!state.levelStats[levelId]) {
                    state.levelStats[levelId] = { fastestTime: null, lowestDeaths: null, totalAttempts: 0 };
                }
            });
        });
    }

    setSelectedCharacter(characterId) {
        if (characterConfig[characterId] && this.state.selectedCharacter !== characterId) {
            const newStateData = this._cloneState();
            newStateData.selectedCharacter = characterId;
            this.state = new GameState(newStateData);
            this.saveProgress();
            eventBus.publish('gameStateUpdated', this.state);
        }
    }

    incrementAttempts(sectionIndex, levelIndex) {
        const newStateData = this._cloneState();
        const levelId = `${sectionIndex}-${levelIndex}`;
        if (newStateData.levelStats[levelId]) {
            newStateData.levelStats[levelId].totalAttempts += 1;
            this.state = new GameState(newStateData);
            this.saveProgress();
            eventBus.publish('gameStateUpdated', this.state);
        }
    }

    onLevelComplete(runStats) {
        const newStateData = this._cloneState();
        const levelId = `${this.state.currentSection}-${this.state.currentLevelIndex}`;

        if (!newStateData.levelProgress.completedLevels.includes(levelId)) {
            newStateData.levelProgress.completedLevels.push(levelId);
        }

        const currentLinearIndex = getLinearIndex(this.state.currentSection, this.state.currentLevelIndex, levelSections);
        const nextLevelLinearIndex = currentLinearIndex + 1;
        const totalOfficialLevels = levelSections.filter(s => s.name !== 'DIY').reduce((acc, s) => acc + s.levels.length, 0);

        if (nextLevelLinearIndex < totalOfficialLevels) {
            const newUnlockedCount = nextLevelLinearIndex + 1;
            if (newUnlockedCount > newStateData.levelProgress.unlockedLevelsCount) {
                newStateData.levelProgress.unlockedLevelsCount = newUnlockedCount;
            }
        }

        const currentStats = newStateData.levelStats[levelId];
        if (currentStats) {
            if (currentStats.fastestTime === null || runStats.time < currentStats.fastestTime) {
                currentStats.fastestTime = runStats.time;
            }
            if (currentStats.lowestDeaths === null || runStats.deaths < currentStats.lowestDeaths) {
                currentStats.lowestDeaths = runStats.deaths;
            }
        }

        newStateData.showingLevelComplete = true;
        this.state = new GameState(newStateData);
        this.saveProgress();
        eventBus.publish('gameStateUpdated', this.state);
        eventBus.publish('playSound', { key: 'level_complete', volume: 1.0, channel: 'UI' });
    }

    isCharacterUnlocked(characterId) {
        const config = characterConfig[characterId];
        if (!config) return false;
        const completedCount = this.state.levelProgress.completedLevels.length;
        return completedCount >= config.unlockRequirement;
    }

    isLevelUnlocked(sectionIndex, levelIndex) {
        const section = levelSections[sectionIndex];
        if (section && section.name === 'DIY') return true;
        const levelLinearIndex = getLinearIndex(sectionIndex, levelIndex, levelSections);
        return levelLinearIndex < this.state.levelProgress.unlockedLevelsCount;
    }

    isLevelCompleted(sectionIndex, levelIndex) {
        const levelId = `${sectionIndex}-${levelIndex}`;
        return this.state.levelProgress.completedLevels.includes(levelId);
    }

    resetProgress() {
        try {
            localStorage.removeItem('parkourGameState');
            this.loadProgress();
            console.log("Game progress has been reset.");
        } catch (e) {
            console.error("Failed to reset game state in localStorage", e);
        }
    }

    markTutorialAsShown() {
        if (this.state.tutorialShown) return;
        const newStateData = this._cloneState();
        newStateData.tutorialShown = true;
        this.state = new GameState(newStateData);
        this.saveProgress();
        eventBus.publish('gameStateUpdated', this.state);
    }

    unlockAllLevels() {
        const newStateData = this._cloneState();
        const totalOfficialLevels = levelSections.filter(s => s.name !== 'DIY').reduce((acc, s) => acc + s.levels.length, 0);
        newStateData.levelProgress.unlockedLevelsCount = totalOfficialLevels;

        newStateData.levelProgress.completedLevels = [];
        levelSections.forEach((section, sIdx) => {
            if (section.name !== 'DIY') {
                section.levels.forEach((_, lIdx) => {
                    newStateData.levelProgress.completedLevels.push(`${sIdx}-${lIdx}`);
                });
            }
        });

        this.state = new GameState(newStateData);
        this.saveProgress();
        eventBus.publish('gameStateUpdated', this.state);
        console.log("All levels have been unlocked.");
    }
}

export const gameStateManager = new GameStateManager();