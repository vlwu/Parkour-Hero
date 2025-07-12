export async function loadAssets() {
  const images = {};
  const sounds = {};
  
  const imagePaths = {
    backgroundTile: 'assets/Background/Brown.png',
    block: 'assets/Terrain/Terrain.png',
    playerJump: 'assets/MainCharacters/PinkMan/jump.png',
    playerDoubleJump: 'assets/MainCharacters/PinkMan/double_jump.png',
    playerIdle: 'assets/MainCharacters/PinkMan/idle.png',
    playerRun: 'assets/MainCharacters/PinkMan/run.png',
    playerFall: 'assets/MainCharacters/PinkMan/fall.png',
    playerDash: 'assets/MainCharacters/PinkMan/dash.png',
    playerCling: 'assets/MainCharacters/PinkMan/wall_jump.png',

    // Fruit spritesheets (animated)
    fruit_apple: 'assets/Items/Fruits/Apple.png',
    fruit_bananas: 'assets/Items/Fruits/Bananas.png',
    fruit_cherries: 'assets/Items/Fruits/Cherries.png',
    fruit_kiwi: 'assets/Items/Fruits/Kiwi.png',
    fruit_melon: 'assets/Items/Fruits/Melon.png',
    fruit_orange: 'assets/Items/Fruits/Orange.png',
    fruit_pineapple: 'assets/Items/Fruits/Pineapple.png',
    fruit_strawberry: 'assets/Items/Fruits/Strawberry.png',
    fruit_collected: 'assets/Items/Fruits/Collected.png',

    // Menu items
    settings_button: 'assets/Menu/Buttons/Settings.png',
    close_button: 'assets/Menu/Buttons/Close.png',
    restart_button: 'assets/Menu/Buttons/Restart.png',
    levels_button: 'assets/Menu/Buttons/Levels.png',
    sound_button: 'assets/Menu/Buttons/Volume.png',

    // Level assets
    trophy: 'assets/Items/Checkpoints/End/End (Pressed).png',
    start: 'assets/Items/Checkpoints/Start/Start (Moving).png',
  };

  const soundPaths = {
    jump: 'assets/Sounds/Player Jump.mp3',
    collect: 'assets/Sounds/Fruit Collect.mp3',
    level_complete: 'assets/Sounds/Level Complete.mp3',
  };

  console.log('Starting asset loading...');
  
  // Track loading progress
  let loadedCount = 0;
  const totalCount = Object.keys(imagePaths).length + Object.keys(soundPaths).length;
  
  // Load images
  const imagePromises = Object.entries(imagePaths).map(([key, src]) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        images[key] = img;
        loadedCount++;
        console.log(`Loaded image ${key} (${loadedCount}/${totalCount})`);
        console.log(`  ${key}: ${img.width}x${img.height}`);
        resolve();
      };
      
      img.onerror = (error) => {
        console.error(`Failed to load image: ${src}`, error);
        
        // Create a fallback colored rectangle
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 32;
        fallbackCanvas.height = 32;
        const fallbackCtx = fallbackCanvas.getContext('2d');
        
        // Different colors for different asset types
        if (key.includes('background')) {
          fallbackCtx.fillStyle = '#87CEEB';
        } else if (key.includes('player')) {
          fallbackCtx.fillStyle = '#ff8c21ff';
        } else if (key.includes('fruit')) {
          fallbackCtx.fillStyle = '#FF6B6B';
        } else {
          fallbackCtx.fillStyle = '#808080';
        }
        
        fallbackCtx.fillRect(0, 0, 64, 64);
        
        // Add a simple pattern to distinguish it as a fallback
        fallbackCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        fallbackCtx.fillRect(0, 0, 32, 32);
        fallbackCtx.fillRect(32, 32, 32, 32);
        
        // Convert canvas to image
        const fallbackImg = new Image();
        fallbackImg.src = fallbackCanvas.toDataURL();
        images[key] = fallbackImg;
        
        console.warn(`Using fallback for ${key}`);
        resolve();
      };
      
      img.crossOrigin = 'anonymous';
      img.src = src;
      
      // Add timeout to prevent hanging
      setTimeout(() => {
        if (!images[key]) {
          img.onerror(new Error('Image loading timeout'));
        }
      }, 10000);
    });
  });

  // Load sounds
  const soundPromises = Object.entries(soundPaths).map(([key, src]) => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.addEventListener('canplaythrough', () => {
        sounds[key] = audio;
        loadedCount++;
        console.log(`Loaded sound ${key} (${loadedCount}/${totalCount})`);
        resolve();
      });
      
      audio.addEventListener('error', (error) => {
        console.warn(`Failed to load sound: ${src}`, error);
        // Create a silent audio fallback
        const silentAudio = new Audio();
        silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        sounds[key] = silentAudio;
        loadedCount++;
        console.warn(`Using silent fallback for ${key}`);
        resolve();
      });
      
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audio.src = src;
      
      // Add timeout to prevent hanging
      setTimeout(() => {
        if (!sounds[key]) {
          audio.dispatchEvent(new Event('error'));
        }
      }, 10000);
    });
  });

  try {
    // Wait for all assets to load
    await Promise.all([...imagePromises, ...soundPromises]);
    
    // Combine images and sounds into a single assets object
    const assets = { ...images, ...sounds };
    
    console.log('All assets loaded successfully!');
    console.log('Available assets:', Object.keys(assets));
    return assets;
  } catch (error) {
    console.error('Asset loading failed:', error);
    throw error;
  }
}

// Utility function to check if an asset exists and is loaded
export function isAssetLoaded(assets, key) {
  return assets && assets[key] && (assets[key].complete || assets[key].readyState >= 2);
}

// Utility function to get asset dimensions
export function getAssetDimensions(assets, key) {
  if (!isAssetLoaded(assets, key)) {
    return { width: 0, height: 0 };
  }
  
  const asset = assets[key];
  return {
    width: asset.width || 0,
    height: asset.height || 0
  };
}

// Utility function to create a simple colored fallback image
export function createFallbackImage(width = 64, height = 64, color = '#808080') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  // Add a simple pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(0, 0, width/2, height/2);
  ctx.fillRect(width/2, height/2, width/2, height/2);
  
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}