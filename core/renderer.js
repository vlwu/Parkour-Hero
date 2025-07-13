export class Renderer {
  constructor(ctx, canvas, assets, camera) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.assets = assets;
    this.camera = camera;
    this.parallaxLayers = [];
    this.particleEffects = [];
  }

  render(gameState) {
    const currentLevel = gameState.getCurrentLevel();
    const player = gameState.getPlayer();
    
    if (!currentLevel || !player) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Save context for camera transformations
    this.ctx.save();
    
    // Apply camera transformation
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    // Apply screen shake if active
    if (this.camera.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.camera.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.camera.shakeIntensity;
      this.ctx.translate(shakeX, shakeY);
    }

    // Render background
    this.renderBackground(currentLevel);
    
    // Render parallax layers
    this.renderParallaxLayers();
    
    // Render level elements
    this.renderLevel(currentLevel);
    
    // Render entities
    this.renderPlayer(player);
    this.renderEnemies(currentLevel);
    this.renderCollectibles(currentLevel);
    
    // Render particle effects
    this.renderParticleEffects();
    
    // Render foreground elements
    this.renderForeground(currentLevel);
    
    // Restore context
    this.ctx.restore();
  }

  renderBackground(level) {
    // Render sky/background color
    this.ctx.fillStyle = level.backgroundColor || '#87CEEB';
    this.ctx.fillRect(
      this.camera.x - 100, 
      this.camera.y - 100, 
      this.canvas.width + 200, 
      this.canvas.height + 200
    );
    
    // Render background tiles if available
    if (level.backgroundTiles) {
      level.backgroundTiles.forEach(tile => {
        this.renderTile(tile);
      });
    }
  }

  renderParallaxLayers() {
    this.parallaxLayers.forEach(layer => {
      this.ctx.save();
      this.ctx.translate(this.camera.x * layer.speed, this.camera.y * layer.speed);
      
      if (layer.image) {
        this.ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
      }
      
      this.ctx.restore();
    });
  }

  renderLevel(level) {
    // Render static level geometry
    if (level.platforms) {
      level.platforms.forEach(platform => {
        this.renderPlatform(platform);
      });
    }
    
    // Render walls
    if (level.walls) {
      level.walls.forEach(wall => {
        this.renderWall(wall);
      });
    }
    
    // Render spikes and hazards
    if (level.spikes) {
      level.spikes.forEach(spike => {
        this.renderSpike(spike);
      });
    }
    
    // Render moving platforms
    if (level.movingPlatforms) {
      level.movingPlatforms.forEach(platform => {
        this.renderMovingPlatform(platform);
      });
    }
    
    // Render checkpoints
    if (level.checkpoints) {
      level.checkpoints.forEach(checkpoint => {
        this.renderCheckpoint(checkpoint);
      });
    }
  }

  renderPlayer(player) {
    this.ctx.save();
    
    // Apply player position
    this.ctx.translate(player.x, player.y);
    
    // Flip sprite if facing left
    if (player.facingLeft) {
      this.ctx.scale(-1, 1);
    }
    
    // Get current animation frame
    const sprite = this.getPlayerSprite(player);
    
    if (sprite) {
      this.ctx.drawImage(
        sprite,
        -player.width / 2,
        -player.height / 2,
        player.width,
        player.height
      );
    } else {
      // Fallback rectangle if no sprite
      this.ctx.fillStyle = player.color || '#FF6B6B';
      this.ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    }
    
    // Render dash trail effect
    if (player.isDashing) {
      this.renderDashTrail(player);
    }
    
    this.ctx.restore();
  }

  renderEnemies(level) {
    if (level.enemies) {
      level.enemies.forEach(enemy => {
        this.ctx.save();
        this.ctx.translate(enemy.x, enemy.y);
        
        if (enemy.facingLeft) {
          this.ctx.scale(-1, 1);
        }
        
        const sprite = this.getEnemySprite(enemy);
        if (sprite) {
          this.ctx.drawImage(
            sprite,
            -enemy.width / 2,
            -enemy.height / 2,
            enemy.width,
            enemy.height
          );
        } else {
          this.ctx.fillStyle = enemy.color || '#FF4444';
          this.ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
        }
        
        this.ctx.restore();
      });
    }
  }

  renderCollectibles(level) {
    // Render fruits
    if (level.fruits) {
      level.fruits.forEach(fruit => {
        if (!fruit.collected) {
          this.ctx.save();
          this.ctx.translate(fruit.x, fruit.y);
          
          // Apply collection animation
          if (fruit.animationScale) {
            this.ctx.scale(fruit.animationScale, fruit.animationScale);
          }
          
          const sprite = this.assets.sprites && this.assets.sprites[fruit.type];
          if (sprite) {
            this.ctx.drawImage(
              sprite,
              -fruit.width / 2,
              -fruit.height / 2,
              fruit.width,
              fruit.height
            );
          } else {
            this.ctx.fillStyle = fruit.color || '#FFD700';
            this.ctx.fillRect(-fruit.width / 2, -fruit.height / 2, fruit.width, fruit.height);
          }
          
          this.ctx.restore();
        }
      });
    }
    
    // Render trophy/exit
    if (level.trophy && !level.trophy.collected) {
      this.ctx.save();
      this.ctx.translate(level.trophy.x, level.trophy.y);
      
      // Apply trophy animation
      if (level.trophy.animationScale) {
        this.ctx.scale(level.trophy.animationScale, level.trophy.animationScale);
      }
      
      const sprite = this.assets.sprites && this.assets.sprites.trophy;
      if (sprite) {
        this.ctx.drawImage(
          sprite,
          -level.trophy.width / 2,
          -level.trophy.height / 2,
          level.trophy.width,
          level.trophy.height
        );
      } else {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(-level.trophy.width / 2, -level.trophy.height / 2, level.trophy.width, level.trophy.height);
      }
      
      this.ctx.restore();
    }
  }

  renderPlatform(platform) {
    const sprite = this.assets.sprites && this.assets.sprites.platform;
    if (sprite) {
      this.ctx.drawImage(sprite, platform.x, platform.y, platform.width, platform.height);
    } else {
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    }
  }

  renderWall(wall) {
    const sprite = this.assets.sprites && this.assets.sprites.wall;
    if (sprite) {
      this.ctx.drawImage(sprite, wall.x, wall.y, wall.width, wall.height);
    } else {
      this.ctx.fillStyle = '#696969';
      this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    }
  }

  renderSpike(spike) {
    const sprite = this.assets.sprites && this.assets.sprites.spike;
    if (sprite) {
      this.ctx.drawImage(sprite, spike.x, spike.y, spike.width, spike.height);
    } else {
      this.ctx.fillStyle = '#DC143C';
      this.ctx.fillRect(spike.x, spike.y, spike.width, spike.height);
    }
  }

  renderMovingPlatform(platform) {
    this.ctx.save();
    this.ctx.translate(platform.x, platform.y);
    
    const sprite = this.assets.sprites && this.assets.sprites.movingPlatform;
    if (sprite) {
      this.ctx.drawImage(sprite, -platform.width / 2, -platform.height / 2, platform.width, platform.height);
    } else {
      this.ctx.fillStyle = '#4169E1';
      this.ctx.fillRect(-platform.width / 2, -platform.height / 2, platform.width, platform.height);
    }
    
    this.ctx.restore();
  }

  renderCheckpoint(checkpoint) {
    if (checkpoint.activated) {
      this.ctx.fillStyle = '#00FF00';
    } else {
      this.ctx.fillStyle = '#808080';
    }
    this.ctx.fillRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);
  }

  renderTile(tile) {
    const sprite = this.assets.sprites && this.assets.sprites[tile.type];
    if (sprite) {
      this.ctx.drawImage(sprite, tile.x, tile.y, tile.width, tile.height);
    } else {
      this.ctx.fillStyle = tile.color || '#654321';
      this.ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
    }
  }

  renderDashTrail(player) {
    this.ctx.globalAlpha = 0.5;
    this.ctx.fillStyle = '#00FFFF';
    this.ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    this.ctx.globalAlpha = 1.0;
  }

  renderParticleEffects() {
    this.particleEffects.forEach((effect, index) => {
      if (effect.active) {
        effect.particles.forEach(particle => {
          this.ctx.save();
          this.ctx.translate(particle.x, particle.y);
          this.ctx.globalAlpha = particle.alpha;
          this.ctx.fillStyle = particle.color;
          this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
          this.ctx.restore();
        });
      } else {
        this.particleEffects.splice(index, 1);
      }
    });
  }

  renderForeground(level) {
    // Render foreground elements that appear in front of the player
    if (level.foregroundElements) {
      level.foregroundElements.forEach(element => {
        this.renderTile(element);
      });
    }
  }

  getPlayerSprite(player) {
    if (!this.assets.sprites) return null;
    
    if (player.isDashing) {
      return this.assets.sprites.playerDash;
    } else if (player.velocity.y < 0) {
      return this.assets.sprites.playerJump;
    } else if (player.velocity.y > 0) {
      return this.assets.sprites.playerFall;
    } else if (Math.abs(player.velocity.x) > 0.1) {
      return this.assets.sprites.playerRun;
    } else {
      return this.assets.sprites.playerIdle;
    }
  }

  getEnemySprite(enemy) {
    if (!this.assets.sprites) return null;
    return this.assets.sprites[enemy.type] || this.assets.sprites.enemy;
  }

  addParticleEffect(effect) {
    this.particleEffects.push(effect);
  }

  addParallaxLayer(layer) {
    this.parallaxLayers.push(layer);
  }

  // Debug rendering
  renderDebug(gameState) {
    const player = gameState.getPlayer();
    const level = gameState.getCurrentLevel();
    
    if (!player || !level) return;
    
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    // Render collision boxes
    this.ctx.strokeStyle = '#FF0000';
    this.ctx.lineWidth = 2;
    
    // Player collision box
    this.ctx.strokeRect(
      player.x - player.width / 2,
      player.y - player.height / 2,
      player.width,
      player.height
    );
    
    // Level collision boxes
    if (level.platforms) {
      level.platforms.forEach(platform => {
        this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
      });
    }
    
    this.ctx.restore();
  }
}