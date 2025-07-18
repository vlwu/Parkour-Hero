import { eventBus } from './event-bus.js';

/**
 * Manages a pool of reusable <audio> elements (channels) to prevent
 * performance issues from creating new elements for every sound.
 */
class AudioChannelPool {
  constructor(size = 10) {
    this._pool = [];
    this._inUse = new Set();

    for (let i = 0; i < size; i++) {
      this._pool.push(new Audio());
    }
  }

  // Retrieves an available audio channel from the pool.
  get() {
    let channel;
    if (this._pool.length > 0) {
      channel = this._pool.pop();
    } else {
      // The pool is empty, create a new temporary channel. This allows the system
      // to handle more concurrent sounds than the initial pool size, at the cost of a new object creation.
      channel = new Audio();
      console.warn("Audio channel pool exhausted. Creating temporary channel.");
    }
    this._inUse.add(channel);
    return channel;
  }

  // Releases a channel back to the pool, making it available for reuse.
  release(channel) {
    if (!channel) return;
    
    // Reset properties before putting it back in the pool
    channel.pause();
    channel.currentTime = 0;
    channel.onended = null;
    channel.loop = false;
    channel.src = ''; // Detach the source

    if (this._inUse.has(channel)) {
      this._inUse.delete(channel);
      this._pool.push(channel);
    }
  }
  
   // Releases all currently used channels back into the pool.
  releaseAll() {
    this._inUse.forEach(channel => {
        this.release(channel);
    });
  }
}

export class SoundManager {
  constructor() {
    this.sounds = {};
    this.loopingSounds = {}; // Now stores the active channel, not a clone
    this.audioContext = null;
    this.audioUnlocked = false;
    this.channelPool = new AudioChannelPool(15); // Increased pool size
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
  }

  loadSounds(assets) {
    const soundKeys = ['jump', 'double_jump', 'collect', 'level_complete', 'death_sound', 'dash', 'checkpoint_activated', 
      'sand_walk', 'mud_run', 'ice_run'];
    soundKeys.forEach(key => {
      if (assets[key]) {
        this.sounds[key] = assets[key];
        // The original asset's volume is set, but not used for playback directly.
        this.sounds[key].volume = this.settings.volume;
      } else {
        console.warn(`Sound asset ${key} not found in assets`);
      }
    });
  }

  async play(soundKey, volumeMultiplier = 1.0) {
    const sourceSound = this.sounds[soundKey];
    if (!this.settings.enabled || !sourceSound) {
      return;
    }

    if (!this.audioUnlocked) {
      await this.unlockAudio();
    }
    
    const channel = this.channelPool.get();
    if (!channel) {
        console.warn(`Could not play sound ${soundKey}: no available audio channels.`);
        return;
    }

    try {
      // When the sound finishes playing, release the channel back to the pool.
      channel.onended = () => {
        this.channelPool.release(channel);
      };
      
      channel.src = sourceSound.src;
      channel.volume = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));
      await channel.play();
    } catch (error) {
      console.error(`Failed to play sound ${soundKey}:`, error);
      // Ensure the channel is released even if playback fails.
      this.channelPool.release(channel);
    }
  }

  async playLoop(soundKey, volumeMultiplier = 1.0) {
    const sourceSound = this.sounds[soundKey];
    if (!this.settings.enabled || !sourceSound || this.loopingSounds[soundKey]) {
      return;
    }
    if (!this.audioUnlocked) await this.unlockAudio();

    const channel = this.channelPool.get();
    if (!channel) {
        console.warn(`Could not play loop ${soundKey}: no available audio channels.`);
        return;
    }
    
    try {
      channel.src = sourceSound.src;
      channel.volume = Math.max(0, Math.min(1, this.settings.volume * volumeMultiplier));
      channel.loop = true;
      await channel.play();
      this.loopingSounds[soundKey] = channel; // Store the channel itself
    } catch (error) {
      console.error(`Failed to play looping sound ${soundKey}:`, error);
      this.channelPool.release(channel);
    }
  }

  stopLoop(soundKey) {
    const channel = this.loopingSounds[soundKey];
    if (channel) {
      this.channelPool.release(channel);
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
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume().catch(e => console.error("Failed to resume AudioContext", e));
    }

    if (this.audioContext && this.audioContext.state === 'running') {
        this.audioUnlocked = true;
    }
  }

  stopAll() {
    // This stops all looping sounds and returns their channels to the pool.
    this.stopAllLoops();
    // Non-looping sounds will stop on their own and their channels will be auto-released.
    // For an immediate stop of everything, we could iterate all in-use channels.
    // However, the current implementation is often sufficient.
  }

  setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    // Update the volume of currently playing looping sounds.
    for(const channel of Object.values(this.loopingSounds)) {
      // Here we can't know the original volumeMultiplier, so we just set it to the base volume.
      // This is a limitation, but acceptable for most use cases.
      channel.volume = this.settings.volume;
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