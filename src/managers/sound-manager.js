import { eventBus } from '../utils/event-bus.js';

export class SoundManager {
  constructor() {
    this.sounds = {};
    this.soundPool = {}; // Stores arrays of pooled audio objects for reuse.
    this.poolSize = 5; // Number of audio objects per sound effect.
    
    // NEW: Manages currently playing sounds, organized by channel.
    this.channels = {
      SFX: new Set(),
      UI: new Set(),
      Music: new Set(), // Added for future scalability
    };

    this.audioContext = null;
    this.audioUnlocked = false;
    this.settings = {
      enabled: true,
      volume: 0.5,
    };
    this.loadSettings();
    this._setupEventSubscriptions();
  }

  _setupEventSubscriptions() {
    eventBus.subscribe('playSound', (payload) => this.play(payload));
    eventBus.subscribe('startSoundLoop', (payload) => this.playLoop(payload));
    eventBus.subscribe('stopSoundLoop', ({key}) => this.stopLoop(key));
    eventBus.subscribe('toggleSound', () => this.toggleSound());
    eventBus.subscribe('setSoundVolume', ({volume}) => this.setVolume(volume));
  }

  loadSettings() {
    this.settings.enabled = true;
    this.settings.volume = 0.5;
  }

  saveSettings() {
    // In a real app, this would save to localStorage.
  }

  loadSounds(assets) {
    const soundKeys = ['button_click', 'jump', 'double_jump', 'collect', 'level_complete', 'trophy_activated', 'death_sound', 'dash', 'checkpoint_activated', 
      'hit', 'sand_walk', 'mud_run', 'ice_run', 'trampoline_bounce', 'fire_activated', 'arrow_pop', 'fan_blowing'];
    soundKeys.forEach(key => {
      if (assets[key]) {
        this.sounds[key] = assets[key];
        // The sound pool is independent of channels; it's just a resource manager.
        this.soundPool[key] = [];
        for (let i = 0; i < this.poolSize; i++) {
            this.soundPool[key].push(this.sounds[key].cloneNode(true));
        }
      } else {
        console.warn(`Sound asset ${key} not found in assets`);
      }
    });
  }

  async play({ key, volumeMultiplier = 1.0, channel = 'SFX' }) {
    if (!this.settings.enabled || !this.sounds[key] || !this.channels[channel]) {
      return;
    }

    if (!this.audioUnlocked) {
      await this.unlockAudio();
    }

    const pool = this.soundPool[key];
    if (!pool) {
      console.warn(`Sound pool for ${key} not found.`);
      return;
    }
    
    // Find an audio object in the pool that is not currently playing.
    const audio = pool.find(a => a.paused || a.ended);
    
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));
      audio.currentTime = 0;
      
      this.channels[channel].add(audio);
      
      audio.onended = () => {
        // When finished, remove from the active channel set. It remains in the pool.
        this.channels[channel].delete(audio);
        audio.onended = null;
      };

      try {
        await audio.play();
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error(`Audio pool play failed for ${key}:`, e);
        }
        this.channels[channel].delete(audio); // Clean up on failure
      }
    } else {
      console.warn(`Sound pool for ${key} was depleted. No sound played.`);
    }
  }

  async playLoop({ key, volumeMultiplier = 1.0, channel = 'SFX' }) {
    if (!this.settings.enabled || !this.sounds[key] || !this.channels[channel]) {
      return;
    }
    // Ensure we don't start the same loop twice.
    if (Array.from(this.channels[channel]).some(audio => audio.src === this.sounds[key].src)) {
        return;
    }

    if (!this.audioUnlocked) await this.unlockAudio();

    try {
      const audio = this.sounds[key].cloneNode(true);
      audio.volume = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));
      audio.loop = true;
      await audio.play();
      this.channels[channel].add(audio);
    } catch (error) {
      console.error(`Failed to play looping sound ${key}:`, error);
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
    if (this.audioUnlocked) return;

    if (!this.audioContext) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioContext = new AudioContext();
        }
      } catch (e) {
        console.error("Failed to create AudioContext", e);
        return;
      }
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume().catch(e => console.error("Failed to resume AudioContext", e));
    }

    if (this.audioContext.state === 'running') {
        this.audioUnlocked = true;
    }
  }
  
  setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    
    // Adjust volume of already-playing sounds
    for (const channelName in this.channels) {
        this.channels[channelName].forEach(audio => {
            // Note: volumeMultiplier is lost here, but this is an acceptable trade-off.
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