import { eventBus } from '../utils/event-bus.js';

// Sounds that are UI notifications and should not be pooled or stopped by a global pause.
const UI_SOUNDS = ['level_complete', 'checkpoint_activated'];

export class SoundManager {
  constructor() {
    this.sounds = {};
    this.loopingSounds = {}; // To manage active looping sounds
    this.soundPool = {}; // To manage pooled audio objects
    this.poolSize = 5; // Number of audio objects to pool per sound effect

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

        // Only pool sounds that are not designated as UI sounds or looping sounds.
        const isLoopingSound = key.includes('walk') || key.includes('run');
        if (!isLoopingSound && !UI_SOUNDS.includes(key)) {
            this.soundPool[key] = [];
            for (let i = 0; i < this.poolSize; i++) {
                const clone = this.sounds[key].cloneNode(true);
                this.soundPool[key].push({ audio: clone, inUse: false });
            }
        }
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

    // If it's a designated UI sound, play it as a one-off clone that won't be interrupted by the pool's stopAll logic.
    if (UI_SOUNDS.includes(soundKey)) {
        try {
            const audioClone = this.sounds[soundKey].cloneNode(true);
            audioClone.volume = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));
            audioClone.currentTime = 0;
            await audioClone.play();
        } catch (error) {
            // This can still fail if the user clicks away, but it won't be from our own pause() call.
            if (error.name !== 'AbortError') {
              console.error(`Failed to play UI sound ${soundKey}:`, error);
            }
        }
        return;
    }

    // For all other sounds, use the performance-optimized pool.
    const pool = this.soundPool[soundKey];
    if (!pool) {
        console.warn(`Sound ${soundKey} is not a pooled sound. Use playLoop for looping audio.`);
        return;
    }

    try {
        let soundToPlay = pool.find(s => !s.inUse);

        if (soundToPlay) {
            soundToPlay.inUse = true;
            const audio = soundToPlay.audio;
            
            audio.volume = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));
            audio.currentTime = 0;
            
            audio.onended = () => {
                soundToPlay.inUse = false;
                audio.onended = null; // Clean up listener
            };
            
            await audio.play().catch(e => {
                // This error might still happen if the user switches tabs, but not from our code.
                if (e.name !== 'AbortError') {
                    console.error(`Audio pool play failed for ${soundKey}:`, e);
                }
                soundToPlay.inUse = false; // Release on error
            });
        } else {
            console.warn(`Sound pool for ${soundKey} was depleted. No sound played.`);
        }
    } catch (error) {
      console.error(`Failed to play sound from pool ${soundKey}:`, error);
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
    // This is less relevant for pooled sounds, but good for loops.
    if (this.loopingSounds[soundKey]) {
        this.stopLoop(soundKey);
    }
  }

  stopAll() {
    this.stopAllLoops();
    // This part is now safe because the problematic UI sounds are not in the pool.
    Object.values(this.soundPool).forEach(pool => {
        pool.forEach(pooledSound => {
            if (pooledSound.inUse) {
                pooledSound.audio.pause();
                pooledSound.audio.currentTime = 0;
                pooledSound.inUse = false;
            }
        });
    });
  }

  setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.volume = this.settings.volume;
      }
    });
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