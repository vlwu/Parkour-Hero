export class SoundManager {
  constructor() {
    this.sounds = {};
    this.audioContext = null;
    this.audioUnlocked = false;
    this.settings = {
      enabled: true,
      volume: 0.5,
    };
    this.onSettingsChange = null;
    this.loadSettings();
  }

  loadSettings() {
    this.enabled = this.settings.enabled;
    this.volume = this.settings.volume;
  }

  saveSettings() {
    this.settings.enabled = this.enabled;
    this.settings.volume = this.volume;
    if (this.onSettingsChange) {
      this.onSettingsChange(this.getSettings());
    }
  }

  setSettingsChangeCallback(callback) {
    this.onSettingsChange = callback;
  }

  loadSounds(assets) {
    const soundKeys = ['jump', 'double_jump', 'collect', 'level_complete', 'death_sound', 'dash', 'checkpoint_activated'];
    soundKeys.forEach(key => {
      if (assets[key]) {
        this.sounds[key] = assets[key];
        this.sounds[key].volume = this.volume;
      } else {
        console.warn(`Sound asset ${key} not found in assets`);
      }
    });
  }

  async play(soundKey, volumeMultiplier = 1.0) {
    if (!this.enabled || !this.sounds[soundKey]) {
      return;
    }

    if (!this.audioUnlocked) {
      await this.unlockAudio();
    }

    try {
      const audioClone = this.sounds[soundKey].cloneNode(true);
      audioClone.volume = Math.max(0, Math.min(1, this.volume * volumeMultiplier));
      audioClone.currentTime = 0;
      await audioClone.play();
    } catch (error) {
      console.error(`Failed to play sound ${soundKey}:`, error);
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
    Object.keys(this.sounds).forEach(this.stop.bind(this));
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.volume = this.volume;
      }
    });
    this.saveSettings();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!this.enabled) {
      this.stopAll();
    }
    this.saveSettings();
  }
  
  toggleSound() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  getSettings() {
    return {
      enabled: this.enabled,
      volume: this.volume,
      audioUnlocked: this.audioUnlocked,
    };
  }

  getDebugInfo() {
    return {
      ...this.getSettings(),
      audioContextState: this.audioContext?.state,
      soundCount: Object.keys(this.sounds).length,
      sounds: Object.keys(this.sounds).map(key => ({
        key,
        ready: this.sounds[key]?.readyState >= 2,
        duration: this.sounds[key]?.duration,
      })),
    };
  }
}