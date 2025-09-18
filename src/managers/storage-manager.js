import { characterConfig, levelSections } from '../entities/level-definitions.js';

export class StorageManager {
    static _getDefaultState() {
        return {
            levelProgress: { unlockedLevels: [1], completedLevels: [] },
            selectedCharacter: 'PinkMan',
            levelStats: {},
            tutorialShown: false,
        };
    }

    static _getDefaultSettings() {
        return {
            sound: {
                enabled: true,
                volume: 0.5,
            },
            keybinds: {
                moveLeft: 'a',
                moveRight: 'd',
                jump: ' ',
                dash: 'e',
            },
            gameplay: {
                minimapSize: 1.0,
            }
        };
    }

    static loadProgress() {
        try {
            const saved = localStorage.getItem('parkourGameState');
            if (!saved) return this._getDefaultState();

            const state = JSON.parse(saved);
            if (typeof state !== 'object' || state === null) return this._getDefaultState();

            const lp = state.levelProgress;
            if (typeof lp !== 'object' || lp === null || !Array.isArray(lp.unlockedLevels) || !Array.isArray(lp.completedLevels)) {
                 return this._getDefaultState();
            }

            if (typeof state.selectedCharacter !== 'string' || !characterConfig[state.selectedCharacter]) {
                state.selectedCharacter = 'PinkMan';
            }

            if (!state.levelStats || typeof state.levelStats !== 'object') {
                state.levelStats = {};
            }
             if (typeof state.tutorialShown !== 'boolean') {
                state.tutorialShown = false;
            }

            return state;
        } catch (e) {
            console.error("Failed to parse game state from localStorage. Resetting to default.", e);
            return this._getDefaultState();
        }
    }

    static saveProgress(gameState) {
        try {
            const stateToSave = {
                levelProgress: gameState.levelProgress,
                selectedCharacter: gameState.selectedCharacter,
                levelStats: gameState.levelStats,
                tutorialShown: gameState.tutorialShown,
            };
            localStorage.setItem('parkourGameState', JSON.stringify(stateToSave));
            console.log("Progress saved:", stateToSave);
        } catch (e) {
            console.error("Failed to save game state to localStorage", e);
        }
    }

    static resetProgress() {
        try {
            localStorage.removeItem('parkourGameState');
            console.log("Game progress has been reset.");
        } catch (e) {
            console.error("Failed to reset game state in localStorage", e);
        }
    }

    static loadSettings() {
        try {
            const saved = localStorage.getItem('parkourUserSettings');
            if (!saved) return this._getDefaultSettings();
            const savedSettings = JSON.parse(saved);

            const defaultSettings = this._getDefaultSettings();

            return {
                sound: { ...defaultSettings.sound, ...savedSettings.sound },
                keybinds: { ...defaultSettings.keybinds, ...savedSettings.keybinds },
                gameplay: { ...defaultSettings.gameplay, ...savedSettings.gameplay },
            };
        } catch (e) {
            console.error("Failed to parse user settings from localStorage. Using defaults.", e);
            return this._getDefaultSettings();
        }
    }

    static saveSettings(settings) {
        try {
            localStorage.setItem('parkourUserSettings', JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save user settings to localStorage", e);
        }
    }
}