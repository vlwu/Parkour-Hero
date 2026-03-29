import { characterConfig, levelSections } from '../entities/level-definitions.js';
import { eventBus } from '../utils/event-bus.js';
import { StorageManager } from './storage-manager.js';
import { EVENTS } from '../utils/constants.js';

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
    constructor(initialState = null) {
        if (initialState) {
            this.currentSection = initialState.currentSection;
            this.currentLevelIndex = initialState.currentLevelIndex;
            this.showingLevelComplete = initialState.showingLevelComplete;
            this.levelProgress = initialState.levelProgress;
            this.selectedCharacter = initialState.selectedCharacter;
            this.levelStats = initialState.levelStats;
            this.tutorialShown = initialState.tutorialShown;
            this.newlyUnlockedCharacter = initialState.newlyUnlockedCharacter;
            this.fruitCoins = initialState.fruitCoins || 0;
            this.unlockedCosmetics = initialState.unlockedCosmetics || ['default_dash', 'default_death', 'default_aura', 'default_mutator'];
            this.equippedCosmetics = initialState.equippedCosmetics || { dash: 'default_dash', death: 'default_death', aura: 'default_aura', mutator: 'default_mutator' };
            
            if (!this.unlockedCosmetics.includes('default_mutator')) {
                this.unlockedCosmetics.push('default_mutator');
            }
            if (!this.equippedCosmetics.mutator) {
                this.equippedCosmetics.mutator = 'default_mutator';
            }
        } else {
            this.showingLevelComplete = false;
            this.levelProgress = { unlockedLevels: [1], completedLevels: [] };
            this.selectedCharacter = 'PinkMan';
            this.levelStats = {};
            this.tutorialShown = false;
            this.newlyUnlockedCharacter = null;
            this.currentSection = 0;
            this.currentLevelIndex = 0;
            this.fruitCoins = 0;
            this.unlockedCosmetics = ['default_dash', 'default_death', 'default_aura', 'default_mutator'];
            this.equippedCosmetics = { dash: 'default_dash', death: 'default_death', aura: 'default_aura', mutator: 'default_mutator' };
            this.ensureStatsForAllLevels();
        }
    }

    static async load() {
        const savedState = await StorageManager.loadProgress();
        const instance = new GameState();
        instance.showingLevelComplete = false;
        instance.levelProgress = savedState.levelProgress;
        instance.selectedCharacter = savedState.selectedCharacter;
        instance.levelStats = savedState.levelStats;
        instance.tutorialShown = savedState.tutorialShown;
        instance.fruitCoins = savedState.fruitCoins;
        instance.unlockedCosmetics = savedState.unlockedCosmetics;
        instance.equippedCosmetics = savedState.equippedCosmetics;
        instance.newlyUnlockedCharacter = null;
        instance.ensureStatsForAllLevels();

        const lastUnlockedLinearIndex = instance.levelProgress.unlockedLevels[0] - 1;
        const { sectionIndex, levelIndex } = getSectionAndLevelFromLinearIndex(lastUnlockedLinearIndex, levelSections);
        instance.currentSection = sectionIndex;
        instance.currentLevelIndex = levelIndex;
        
        return instance;
    }

    _clone() {
        const clonedState = JSON.parse(JSON.stringify(this));
        return new GameState(clonedState);
    }

    setSelectedCharacter(characterId) {
        if (characterConfig[characterId] && this.selectedCharacter !== characterId) {
            const newState = this._clone();
            newState.selectedCharacter = characterId;
            return newState;
        }
        return this;
    }

    ensureStatsForAllLevels() {
        levelSections.forEach((section, sectionIndex) => {
            section.levels.forEach((_, levelIndex) => {
                const levelId = `${sectionIndex}-${levelIndex}`;
                if (!this.levelStats[levelId]) {
                    this.levelStats[levelId] = {
                        fastestTime: null,
                        lowestDeaths: null,
                        totalAttempts: 0,
                    };
                }
            });
        });
    }

    incrementAttempts(sectionIndex, levelIndex) {
        const newState = this._clone();
        const levelId = `${sectionIndex}-${levelIndex}`;
        if (newState.levelStats[levelId]) {
            newState.levelStats[levelId].totalAttempts += 1;
        }
        return newState;
    }

    onLevelComplete(runStats) {
        const newState = this._clone();
        const levelId = `${this.currentSection}-${this.currentLevelIndex}`;
        newState.newlyUnlockedCharacter = null;
        
        // Add collected fruit from this run to global balance
        newState.fruitCoins += (runStats.fruitsCollected || 0);

        if (!this.levelProgress.completedLevels.includes(levelId)) {
            newState.levelProgress.completedLevels.push(levelId);

            const totalLevels = levelSections.reduce((acc, section) => acc + section.levels.length, 0);
            const currentLinearIndex = getLinearIndex(this.currentSection, this.currentLevelIndex, levelSections);

            if (currentLinearIndex + 1 < totalLevels) {
                const nextUnlockedCount = currentLinearIndex + 2;
                if (nextUnlockedCount > this.levelProgress.unlockedLevels[0]) {
                    newState.levelProgress.unlockedLevels[0] = nextUnlockedCount;
                }
            }

            const totalCompleted = newState.levelProgress.completedLevels.length;
            for (const [charId, config] of Object.entries(characterConfig)) {
                if (config.unlockRequirement === totalCompleted) {
                    newState.newlyUnlockedCharacter = charId;
                }
            }
        }

        const currentStats = newState.levelStats[levelId];
        if (currentStats) {
            if (currentStats.fastestTime === null || runStats.time < currentStats.fastestTime) {
                currentStats.fastestTime = runStats.time;
            }
            if (currentStats.lowestDeaths === null || runStats.deaths < currentStats.lowestDeaths) {
                currentStats.lowestDeaths = runStats.deaths;
            }
        }

        newState.showingLevelComplete = true;
        eventBus.publish(EVENTS.PLAY_SOUND, { key: 'level_complete', volume: 1.0, channel: 'UI' });

        return newState;
    }

    addFruitCoins(amount) {
        this.fruitCoins += amount;
    }

    unlockCosmetic(id) {
        if (!this.unlockedCosmetics.includes(id)) {
            this.unlockedCosmetics.push(id);
        }
    }

    equipCosmetic(category, id) {
        if (this.equippedCosmetics.hasOwnProperty(category)) {
            this.equippedCosmetics[category] = id;
        }
    }

    isCharacterUnlocked(characterId) {
        const config = characterConfig[characterId];
        if (!config) return false;
        const completedCount = this.levelProgress.completedLevels.length;
        return completedCount >= config.unlockRequirement;
    }

    isLevelUnlocked(sectionIndex, levelIndex) {
        const section = levelSections[sectionIndex];
        if (section && section.name === 'DIY') {
            return true;
        }
        const levelLinearIndex = getLinearIndex(sectionIndex, levelIndex, levelSections);
        return levelLinearIndex < this.levelProgress.unlockedLevels[0];
    }

    isLevelCompleted(sectionIndex, levelIndex) {
        const levelId = `${sectionIndex}-${levelIndex}`;
        return this.levelProgress.completedLevels.includes(levelId);
    }

    static async resetProgress() {
        await StorageManager.resetProgress();
        return await GameState.load();
    }

    markTutorialAsShown() {
        if (this.tutorialShown) return this;
        const newState = this._clone();
        newState.tutorialShown = true;
        return newState;
    }

    unlockAllLevels() {
        const newState = this._clone();
        const totalLevels = levelSections.reduce((acc, section) => {
            if (section.name === 'DIY') return acc;
            return acc + section.levels.length;
        }, 0);
        newState.levelProgress.unlockedLevels[0] = totalLevels;

        newState.levelProgress.completedLevels = [];
        levelSections.forEach((section, sIdx) => {
            if (section.name === 'DIY') return;
            section.levels.forEach((_, lIdx) => {
                newState.levelProgress.completedLevels.push(`${sIdx}-${lIdx}`);
            });
        });

        return newState;
    }

    unlockLevels(count) {
        const totalLevels = levelSections.reduce((acc, section) => {
            if (section.name === 'DIY') return acc;
            return acc + section.levels.length;
        }, 0);

        if (count < 1 || count > totalLevels) {
            throw new Error(`Invalid level count: ${count}. Must be between 1 and ${totalLevels}.`);
        }

        const newState = this._clone();
        
        newState.levelProgress.unlockedLevels[0] = count;
        newState.levelProgress.completedLevels = [];
        
        let levelsAdded = 0;
        for (let sIdx = 0; sIdx < levelSections.length; sIdx++) {
            const section = levelSections[sIdx];
            if (section.name === 'DIY') continue;
            
            for (let lIdx = 0; lIdx < section.levels.length; lIdx++) {
                if (levelsAdded < count - 1) {
                    newState.levelProgress.completedLevels.push(`${sIdx}-${lIdx}`);
                    levelsAdded++;
                } else {
                    break;
                }
            }
            if (levelsAdded >= count - 1) break;
        }

        return newState;
    }
}