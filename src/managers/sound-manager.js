import { eventBus } from '../utils/event-bus.js';
import { StorageManager } from './storage-manager.js';

export class SoundManager {
  constructor() {
    this.sounds = {};
    this.soundPool = {};
    this.poolSize = 5;

    this.channels = {
      SFX: new Set(),
      UI: new Set(),
      Music: new Set(),
    };

    this.audioContext = null;
    this.audioUnlocked = false;
    this.settings = {
      enabled: true,
      volume: 0.5,
    };
    this.subscriptions = [];

    this.loadSettings();
    this._setupEventSubscriptions();
  }

  _setupEventSubscriptions() {
    const subscribeAndTrack = (eventName, callback) => {
        const boundCallback = callback.bind(this);
        this.subscriptions.push({ eventName, callback: boundCallback });
        eventBus.subscribe(eventName, boundCallback);
    };
    subscribeAndTrack('playSound', this.play);
    subscribeAndTrack('startSoundLoop', this.playLoop);
    subscribeAndTrack('stopSoundLoop', ({key}) => this.stopLoop(key));
    subscribeAndTrack('toggleSound', this.toggleSound);
    subscribeAndTrack('setSoundVolume', ({volume}) => this.setVolume(volume));
  }

  destroy() {
      this.subscriptions.forEach(({ eventName, callback }) => {
          eventBus.unsubscribe(eventName, callback);
      });
      this.subscriptions = [];
      this.stopAll();
  }

  loadSettings() {
    const settings = StorageManager.loadSettings();
    this.settings.enabled = settings.sound.enabled;
    this.settings.volume = settings.sound.volume;
  }

  saveSettings() {
      const currentSettings = StorageManager.loadSettings();
      currentSettings.sound = {
          enabled: this.settings.enabled,
          volume: this.settings.volume,
      };
      StorageManager.saveSettings(currentSettings);
  }

  addSounds(assets, soundKeys) {
    soundKeys.forEach(key => {
      if (assets[key] && !this.sounds[key]) {
        this.sounds[key] = assets[key];
        this.soundPool[key] = {
            pool: [],
            next: 0
        };
        for (let i = 0; i < this.poolSize; i++) {
            const clone = this.sounds[key].cloneNode(true);
            clone.load();
            this.soundPool[key].pool.push(clone);
        }
      }
    });
  }

  async play({ key, volumeMultiplier = 1.0, channel = 'SFX' }) {
    if (!this.settings.enabled || !this.sounds[key] || !this.channels[channel]) {
      return;
    }

    await this.unlockAudio();
    if (!this.audioUnlocked) {
      return;
    }

    const poolData = this.soundPool[key];
    if (!poolData || poolData.pool.length === 0) {
      console.warn(`Sound pool for ${key} not found or is empty.`);
      return;
    }


    const audio = poolData.pool[poolData.next];
    poolData.next = (poolData.next + 1) % this.poolSize;

    audio.volume = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));
    audio.currentTime = 0;

    this.channels[channel].add(audio);

    audio.onended = () => {
      this.channels[channel].delete(audio);
      audio.onended = null;
    };

    try {
      await audio.play();
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error(`Audio pool play failed for ${key}:`, e);
      }
      this.audioUnlocked = this.audioContext.state === 'running';
      this.channels[channel].delete(audio);
    }
  }

  async playLoop({ key, volumeMultiplier = 1.0, channel = 'SFX' }) {
    if (!this.settings.enabled || !this.sounds[key] || !this.channels[channel]) {
      return;
    }
    if (Array.from(this.channels[channel]).some(audio => audio.src === this.sounds[key].src)) {
        return;
    }

    await this.unlockAudio();
    if (!this.audioUnlocked) return;

    try {
      const audio = this.sounds[key].cloneNode(true);
      audio.volume = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));
      audio.loop = true;
      await audio.play();
      this.channels[channel].add(audio);
    } catch (error) {
      console.error(`Failed to play looping sound ${key}:`, error);
      this.audioUnlocked = this.audioContext.state === 'running';
    }
  }

  stopLoop(soundKey) {
    const soundSrc = this.sounds[soundKey]?.src;
    if (!soundSrc) return;

    for (const channelName in this.channels) {
        this.channels[channelName].forEach(audio => {
            if (audio.src === soundSrc && audio.loop) {
                audio.pause();
                audio.currentTime = 0;
                this.channels[channelName].delete(audio);
            }
        });
    }
  }

  stopAll({ except = [] } = {}) {
    for (const channelName in this.channels) {
      if (except.includes(channelName)) {
        continue;
      }
      this.channels[channelName].forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      this.channels[channelName].clear();
    }
  }

  async unlockAudio() {
    if (!this.audioContext) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioContext = new AudioContext();
        } else {
            console.warn("AudioContext not supported.");
            this.audioUnlocked = false;
            return;
        }
      } catch (e) {
        console.error("Failed to create AudioContext:", e);
        this.audioUnlocked = false;
        return;
      }
    }

    if (this.audioContext.state === 'suspended') {
      try {
          await this.audioContext.resume();
      } catch(e) {
          console.error("Failed to resume AudioContext:", e);
      }
    }

    this.audioUnlocked = this.audioContext.state === 'running';
  }

  setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(1, volume));

    for (const channelName in this.channels) {
        this.channels[channelName].forEach(audio => {
            audio.volume = this.settings.volume;
        });
    }
    this.saveSettings();
    eventBus.publish('soundSettingsChanged', { soundEnabled: this.settings.enabled, soundVolume: this.settings.volume });
  }

  setEnabled(enabled) {
    this.settings.enabled = enabled;
    if (!this.settings.enabled) {
      this.stopAll();
    }
    this.saveSettings();
    eventBus.publish('soundSettingsChanged', { soundEnabled: this.settings.enabled, soundVolume: this.settings.volume });
  }

  toggleSound() {
    this.setEnabled(!this.settings.enabled);
    return this.settings.enabled;
  }

  getSettings() {
    return {
      soundEnabled: this.settings.enabled,
      soundVolume: this.settings.volume,
      audioUnlocked: this.audioUnlocked,
    };
  }
}