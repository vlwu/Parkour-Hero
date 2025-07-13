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

    // Level assets
    trophy: 'assets/Items/Checkpoints/End/End (Pressed).png',
    start: 'assets/Items/Checkpoints/Start/Start (Moving).png',

    // Menu buttons
    next_level_button: 'assets/Menu/Buttons/Next.png',
    restart_level_button: 'assets/Menu/Buttons/Restart.png',
    previous_level_button: 'assets/Menu/Buttons/Previous.png',
  };

  const soundPaths = {
    jump: 'assets/Sounds/Player Jump.mp3',
    double_jump: 'assets/Sounds/Player Double Jump.mp3',
    collect: 'assets/Sounds/Fruit Collect.mp3',
    level_complete: 'assets/Sounds/Level Complete.mp3',
    death_sound: 'assets/Sounds/Death.mp3',
    dash: 'assets/Sounds/Whoosh.mp3',
  };

  console.log('Starting asset loading...');
  
  // Track loading progress
  let loadedCount = 0;
  const totalCount = Object.keys(imagePaths).length + Object.keys(soundPaths).length;
  
  // Function to check if we're running locally
  const isLocalHost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';
  
  // Load images with better error handling
  const imagePromises = Object.entries(imagePaths).map(([key, src]) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        images[key] = img;
        loadedCount++;
        console.log(`✓ Loaded image ${key} (${loadedCount}/${totalCount})`);
        console.log(`  ${key}: ${img.width}x${img.height} from ${src}`);
        resolve();
      };
      
      img.onerror = (error) => {
        console.error(`✗ Failed to load image: ${src}`, error);
        
        // Create a fallback colored rectangle
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 64;
        fallbackCanvas.height = 64;
        const fallbackCtx = fallbackCanvas.getContext('2d');
        
        // Different colors for different asset types
        let color = '#808080'; // default gray
        if (key.includes('background')) {
          color = '#87CEEB'; // sky blue
        } else if (key.includes('player')) {
          color = '#FF6B35'; // orange
        } else if (key.includes('fruit')) {
          color = '#FF6B6B'; // red
        } else if (key.includes('block') || key.includes('terrain')) {
          color = '#8B4513'; // brown
        } else if (key.includes('trophy')) {
          color = '#FFD700'; // gold
        } else if (key.includes('button')) {
          color = '#4169E1'; // blue
        }
        
        fallbackCtx.fillStyle = color;
        fallbackCtx.fillRect(0, 0, 64, 64);
        
        // Add a simple pattern to distinguish it as a fallback
        fallbackCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        fallbackCtx.fillRect(0, 0, 32, 32);
        fallbackCtx.fillRect(32, 32, 32, 32);
        
        // Add text label
        fallbackCtx.fillStyle = 'white';
        fallbackCtx.font = '8px Arial';
        fallbackCtx.textAlign = 'center';
        fallbackCtx.fillText(key.substring(0, 8), 32, 32);
        
        // Convert canvas to image
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          images[key] = fallbackImg;
          loadedCount++;
          console.warn(`⚠ Using fallback for ${key}`);
          resolve();
        };
        fallbackImg.src = fallbackCanvas.toDataURL();
      };
      
      // Only set crossOrigin for non-local files
      if (!isLocalHost) {
        img.crossOrigin = 'anonymous';
      }
      
      // Set the source last to trigger loading
      img.src = src;
      
      // Add timeout to prevent hanging
      setTimeout(() => {
        if (!images[key]) {
          console.warn(`⏰ Timeout loading image: ${src}`);
          img.onerror(new Error('Image loading timeout'));
        }
      }, 10000);
    });
  });

  // Load sounds with better error handling
  const soundPromises = Object.entries(soundPaths).map(([key, src]) => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      const onSuccess = () => {
        sounds[key] = audio;
        loadedCount++;
        console.log(`✓ Loaded sound ${key} (${loadedCount}/${totalCount})`);
        resolve();
      };
      
      const onError = (error) => {
        console.warn(`✗ Failed to load sound: ${src}`, error);
        // Create a silent audio fallback
        const silentAudio = new Audio();
        silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        silentAudio.volume = 0;
        sounds[key] = silentAudio;
        loadedCount++;
        console.warn(`⚠ Using silent fallback for ${key}`);
        resolve();
      };
      
      // Multiple event listeners for better compatibility
      audio.addEventListener('canplaythrough', onSuccess, { once: true });
      audio.addEventListener('loadeddata', onSuccess, { once: true });
      audio.addEventListener('error', onError, { once: true });
      
      // Only set crossOrigin for non-local files
      if (!isLocalHost) {
        audio.crossOrigin = 'anonymous';
      }
      
      audio.preload = 'auto';
      audio.volume = 0.5; // Set default volume
      
      // Set the source last to trigger loading
      audio.src = src;
      
      // Add timeout to prevent hanging
      setTimeout(() => {
        if (!sounds[key]) {
          console.warn(`⏰ Timeout loading sound: ${src}`);
          onError(new Error('Sound loading timeout'));
        }
      }, 10000);
    });
  });

  try {
    // Wait for all assets to load
    await Promise.all([...imagePromises, ...soundPromises]);
    
    // Combine images and sounds into a single assets object
    const assets = { ...images, ...sounds };
    
    console.log('🎉 All assets loaded successfully!');
    console.log('📦 Available assets:', Object.keys(assets).sort());
    
    // Log any assets that are using fallbacks
    const fallbackAssets = Object.keys(assets).filter(key => {
      const asset = assets[key];
      return (asset.src && asset.src.startsWith('data:')) || 
             (asset.src && asset.src.includes('data:audio/wav;base64'));
    });
    
    if (fallbackAssets.length > 0) {
      console.warn('⚠ Assets using fallbacks:', fallbackAssets);
    }
    
    return assets;
  } catch (error) {
    console.error('💥 Asset loading failed:', error);
    throw error;
  }
}

// Utility function to check if an asset exists and is loaded
export function isAssetLoaded(assets, key) {
  if (!assets || !assets[key]) return false;
  
  const asset = assets[key];
  
  // For images
  if (asset.complete !== undefined) {
    return asset.complete && asset.naturalWidth > 0;
  }
  
  // For audio
  if (asset.readyState !== undefined) {
    return asset.readyState >= 2; // HAVE_CURRENT_DATA
  }
  
  return false;
}

// Utility function to get asset dimensions
export function getAssetDimensions(assets, key) {
  if (!isAssetLoaded(assets, key)) {
    console.warn(`Asset ${key} not loaded or not found`);
    return { width: 32, height: 32 }; // Default size
  }
  
  const asset = assets[key];
  return {
    width: asset.naturalWidth || asset.width || 32,
    height: asset.naturalHeight || asset.height || 32
  };
}

// Utility function to create a simple colored fallback image
export function createFallbackImage(width = 64, height = 64, color = '#808080', label = '') {
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
  
  // Add label if provided
  if (label) {
    ctx.fillStyle = 'white';
    ctx.font = `${Math.min(width, height) / 8}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(label, width/2, height/2);
  }
  
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

// Debug function to test asset paths
export function testAssetPaths(imagePaths, soundPaths) {
  console.log('🔍 Testing asset paths...');
  
  const testPromises = [];
  
  // Test image paths
  Object.entries(imagePaths).forEach(([key, src]) => {
    const testPromise = fetch(src, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          console.log(`✓ ${key}: ${src} - EXISTS`);
        } else {
          console.error(`✗ ${key}: ${src} - NOT FOUND (${response.status})`);
        }
      })
      .catch(error => {
        console.error(`✗ ${key}: ${src} - ERROR:`, error.message);
      });
    
    testPromises.push(testPromise);
  });
  
  // Test sound paths
  Object.entries(soundPaths).forEach(([key, src]) => {
    const testPromise = fetch(src, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          console.log(`✓ ${key}: ${src} - EXISTS`);
        } else {
          console.error(`✗ ${key}: ${src} - NOT FOUND (${response.status})`);
        }
      })
      .catch(error => {
        console.error(`✗ ${key}: ${src} - ERROR:`, error.message);
      });
    
    testPromises.push(testPromise);
  });
  
  return Promise.all(testPromises);
}