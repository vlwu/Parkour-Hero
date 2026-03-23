import { characterConfig, levelSections } from '../entities/level-definitions.js';

export class StorageManager {
    static _getDefaultState() {
        return {
            levelProgress: { unlockedLevels: [1], completedLevels: [] },
            selectedCharacter: 'PinkMan',
            levelStats: {},
            tutorialShown: false,
            fruitCoins: 0,
            unlockedCosmetics: ['default_dash', 'default_death', 'default_aura'],
            equippedCosmetics: { dash: 'default_dash', death: 'default_death', aura: 'default_aura' }
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

    static async loadProgress() {
        try {
            let state = null;
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                const data = await chrome.storage.sync.get('parkourGameState');
                state = data.parkourGameState || null;
            } else {
                const saved = localStorage.getItem('parkourGameState');
                if (saved) state = JSON.parse(saved);
            }

            if (!state || typeof state !== 'object') return this._getDefaultState();

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
            if (typeof state.fruitCoins !== 'number') {
                state.fruitCoins = 0;
            }
            if (!Array.isArray(state.unlockedCosmetics)) {
                state.unlockedCosmetics = ['default_dash', 'default_death', 'default_aura'];
            }
            if (!state.equippedCosmetics || typeof state.equippedCosmetics !== 'object') {
                state.equippedCosmetics = { dash: 'default_dash', death: 'default_death', aura: 'default_aura' };
            }

            return state;
        } catch (e) {
            console.error("Failed to parse game state from storage. Resetting to default.", e);
            return this._getDefaultState();
        }
    }

    static async saveProgress(gameState) {
        try {
            const stateToSave = {
                levelProgress: gameState.levelProgress,
                selectedCharacter: gameState.selectedCharacter,
                levelStats: gameState.levelStats,
                tutorialShown: gameState.tutorialShown,
                fruitCoins: gameState.fruitCoins,
                unlockedCosmetics: gameState.unlockedCosmetics,
                equippedCosmetics: gameState.equippedCosmetics
            };
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                await chrome.storage.sync.set({ parkourGameState: stateToSave });
            } else {
                localStorage.setItem('parkourGameState', JSON.stringify(stateToSave));
            }
        } catch (e) {
            console.error("Failed to save game state to storage", e);
            localStorage.setItem('parkourGameState', JSON.stringify(gameState));
        }
    }

    static async resetProgress() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                await chrome.storage.sync.remove('parkourGameState');
            } else {
                localStorage.removeItem('parkourGameState');
            }
            console.log("Game progress has been reset.");
        } catch (e) {
            console.error("Failed to reset game state in storage", e);
        }
    }

    static async loadSettings() {
        try {
            let savedSettings = null;
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                const data = await chrome.storage.sync.get('parkourUserSettings');
                savedSettings = data.parkourUserSettings || null;
            } else {
                const saved = localStorage.getItem('parkourUserSettings');
                if (saved) savedSettings = JSON.parse(saved);
            }

            const defaultSettings = this._getDefaultSettings();
            if (!savedSettings) return defaultSettings;

            return {
                sound: { ...defaultSettings.sound, ...savedSettings.sound },
                keybinds: { ...defaultSettings.keybinds, ...savedSettings.keybinds },
                gameplay: { ...defaultSettings.gameplay, ...savedSettings.gameplay },
            };
        } catch (e) {
            console.error("Failed to parse user settings from storage. Using defaults.", e);
            return this._getDefaultSettings();
        }
    }

    static async saveSettings(settings) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                await chrome.storage.sync.set({ parkourUserSettings: settings });
            } else {
                localStorage.setItem('parkourUserSettings', JSON.stringify(settings));
            }
        } catch (e) {
            console.error("Failed to save user settings to storage", e);
        }
    }
}