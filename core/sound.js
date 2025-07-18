import { eventBus } from './event-bus.js';

export class SoundManager {
  constructor() {
    this.sounds = {};
    this.loopingSounds = {}; // To manage active looping sounds
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
    eventBus.subscribe('playSound', ({key, volume}) => this.play(key, volume));
    eventBus.subscribe('startSoundLoop', ({key, volume}) => this.playLoop(key, volume));
    eventBus.subscribe('stopSoundLoop', ({key}) => this.stopLoop(key));
    eventBus.subscribe('toggleSound', () => this.toggleSound());
    eventBus.subscribe('setSoundVolume', ({volume}) => this.setVolume(volume));
  }

  loadSettings() {
    this.settings.enabled = true; // Simplified for this context
    this.settings.volume = 0.5;
  }

  saveSettings() {
    // In a real app, this would save to localStorage.
    // For now, it just updates the internal state.
  }

  loadSounds(assets) {
    const soundKeys = ['jump', 'double_jump', 'collect', 'level_complete', 'death_sound', 'dash', 'checkpoint_activated', 
      'sand_walk', 'mud_run', 'ice_run'];
    soundKeys.forEach(key => {
      if (assets[key]) {
        this.sounds[key] = assets[key];
        this.sounds[key].volume = this.settings.volume;
      } else {
        console.warn(`Sound asset ${key} not found in assets`);
      }
    });
  }

  async play(soundKey, volumeMultiplier = 1.0) {
    if (!this.settings.enabled || !this.sounds[soundKey]) {
      return;
    }

    if (!this.audioUnlocked) {
      await this.unlockAudio();
    }

    try {
      const audioClone = this.sounds[soundKey].cloneNode(true);
      audioClone.volume = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));
      audioClone.currentTime = 0;
      await audioClone.play();
    } catch (error) {
      console.error(`Failed to play sound ${soundKey}:`, error);
    }
  }

  async playLoop(soundKey, volumeMultiplier = 1.0) {
    if (!this.settings.enabled || !this.sounds[soundKey] || this.loopingSounds[soundKey]) {
      return;
    }
    if (!this.audioUnlocked) await this.unlockAudio();

    try {
      const audio = this.sounds[soundKey].cloneNode(true);
      audio.volume = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));
      audio.loop = true;
      await audio.play();
      this.loopingSounds[soundKey] = audio;
    } catch (error) {
      console.error(`Failed to play looping sound ${soundKey}:`, error);
    }
  }

  stopLoop(soundKey) {
    if (this.loopingSounds[soundKey]) {
      this.loopingSounds[soundKey].pause();
      this.loopingSounds[soundKey].currentTime = 0;
      delete this.loopingSounds[soundKey];
    }
  }

  stopAllLoops() {
    for (const soundKey in this.loopingSounds) {
      this.stopLoop(soundKey);
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
        return; // Can't proceed
      }
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume().catch(e => console.error("Failed to resume AudioContext", e));
    }

    if (this.audioContext.state === 'running') {
        this.audioUnlocked = true;
    }
  }

  stop(soundKey) {
    if (this.sounds[soundKey]) {
      this.sounds[soundKey].pause();
      this.sounds[soundKey].currentTime = 0;
    }
  }

  stopAll() {
    this.stopAllLoops();
    Object.values(this.sounds).forEach(sound => {
        if(sound && !sound.paused) {
            sound.pause();
            sound.currentTime = 0;
        }
    });
  }

  setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.volume = this.settings.volume;
      }
    });
     // Also update currently playing loops
    for(const audio of Object.values(this.loopingSounds)) {
      audio.volume = this.settings.volume;
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
      enabled: this.settings.enabled,
      volume: this.settings.volume,
      audioUnlocked: this.audioUnlocked,
    };
  }
}