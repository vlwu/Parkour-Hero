import { eventBus } from '../utils/event-bus.js';
import { StorageManager } from './storage-manager.js';

export class SoundManager {
  constructor(initialSettings) {
    this.sounds = {};
    this.activeSources = {
      SFX: new Set(),
      UI: new Set(),
      Music: new Set(),
    };
    this.loopingSources = new Map();

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
    } catch(e) {
        console.error("AudioContext not supported", e);
    }

    this.audioUnlocked = false;
    this.settings = initialSettings || {
      enabled: true,
      volume: 0.5,
    };
    this.subscriptions = [];

    this._setupEventSubscriptions();
    this._initializeAudioContext();
  }

  _initializeAudioContext() {
    if (!this.audioContext) return;
    
    const unlock = () => {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                this.audioUnlocked = true;
            }).catch(() => {});
        } else if (this.audioContext.state === 'running') {
            this.audioUnlocked = true;
        }
        
        ['click', 'keydown', 'touchstart'].forEach(evt => {
            document.removeEventListener(evt, unlock, { capture: true });
        });
    };

    ['click', 'keydown', 'touchstart'].forEach(evt => {
        document.addEventListener(evt, unlock, { capture: true, once: true });
    });
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

  async saveSettings() {
      const currentSettings = await StorageManager.loadSettings();
      currentSettings.sound = {
          enabled: this.settings.enabled,
          volume: this.settings.volume,
      };
      await StorageManager.saveSettings(currentSettings);
  }

  async addSounds(assets, soundKeys) {
    if (!this.audioContext) return;
    for (const key of soundKeys) {
      if (assets[key] && !this.sounds[key]) {
        try {
          if (assets[key].byteLength > 0) {
              const audioBuffer = await this.audioContext.decodeAudioData(assets[key].slice(0));
              this.sounds[key] = audioBuffer;
          }
        } catch (e) {
          console.error(`Failed to decode audio data for ${key}`, e);
        }
      }
    }
  }

  async play({ key, volumeMultiplier = 1.0, channel = 'SFX' }) {
    if (!this.settings.enabled || !this.sounds[key] || !this.activeSources[channel]) {
      return;
    }

    await this.unlockAudio();
    if (!this.audioUnlocked) {
      return;
    }

    try {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[key];

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start(0);

        this.activeSources[channel].add(source);
        source.onended = () => {
            this.activeSources[channel].delete(source);
            source.disconnect();
            gainNode.disconnect();
        };
    } catch (e) {
        console.error(`Play failed for ${key}:`, e);
    }
  }

  async playLoop({ key, volumeMultiplier = 1.0, channel = 'SFX' }) {
    if (!this.settings.enabled || !this.sounds[key] || !this.activeSources[channel]) return;
    if (this.loopingSources.has(key)) return;

    await this.unlockAudio();
    if (!this.audioUnlocked) return;

    try {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[key];
        source.loop = true;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start(0);
        
        this.loopingSources.set(key, { source, gainNode, channel });
        this.activeSources[channel].add(source);
    } catch (e) {
        console.error(`Play loop failed for ${key}:`, e);
    }
  }

  stopLoop(soundKey) {
    if (this.loopingSources.has(soundKey)) {
        const { source, gainNode, channel } = this.loopingSources.get(soundKey);
        try {
            source.stop();
            source.disconnect();
            gainNode.disconnect();
        } catch (e) {}
        this.activeSources[channel].delete(source);
        this.loopingSources.delete(soundKey);
    }
  }

  stopAll({ except = [] } = {}) {
    for (const channelName in this.activeSources) {
      if (except.includes(channelName)) continue;
      
      this.activeSources[channelName].forEach(source => {
        try {
            source.stop();
            source.disconnect();
        } catch (e) {}
      });
      this.activeSources[channelName].clear();
    }
    
    for (const [key, data] of this.loopingSources.entries()) {
        if (!except.includes(data.channel)) {
            this.loopingSources.delete(key);
        }
    }
  }

  async unlockAudio() {
    if (!this.audioContext) {
      console.warn("AudioContext not available.");
      this.audioUnlocked = false;
      return;
    }

    if (this.audioContext.state === 'suspended') {
      try {
          await this.audioContext.resume();
      } catch(e) {
          // Ignore errors
      }
    }

    this.audioUnlocked = this.audioContext.state === 'running';
  }

  async setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(1, volume));

    for (const data of this.loopingSources.values()) {
        data.gainNode.gain.value = this.settings.volume;
    }

    await this.saveSettings();
    eventBus.publish('soundSettingsChanged', { enabled: this.settings.enabled, volume: this.settings.volume });
  }

  async setEnabled(enabled) {
    this.settings.enabled = enabled;
    if (!this.settings.enabled) {
      this.stopAll();
    }
    await this.saveSettings();
    eventBus.publish('soundSettingsChanged', { enabled: this.settings.enabled, volume: this.settings.volume });
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