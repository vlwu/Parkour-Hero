// src/traps/ArrowBubble.js

import { Trap } from './templates/Trap.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';

/**
 * An Arrow Bubble trap that pops on contact and sends the player flying.
 */
export class ArrowBubble extends Trap {
    /**
     * @param {number} x The initial x-position in the game world.
     * @param {number} y The initial y-position in the game world.
     * @param {object} config The configuration object from the level data.
     */
    constructor(x, y, config) {
        super(x, y, config);
        this.width = 18;
        this.height = 18;
        this.type = 'arrow_bubble';
        
        this.direction = config.direction || 'right';
        this.knockbackSpeed = config.knockbackSpeed || 450;
        
        this.state = 'idle';
        this.RESPAWN_DURATION = 4.0; 
        this.respawnTimer = 0;

        this.idleAnimation = {
            frameCount: 10,
            frameSpeed: 0.1,
            frameTimer: 0,
            currentFrame: 0,
        };

        this.hitAnimation = {
            frameCount: 4,
            frameSpeed: 0.08,
            frameTimer: 0,
            currentFrame: 0,
        };
    }

    /**
     * Updates the bubble's animation state and respawn timer.
     * @param {number} dt Delta time.
     */
    update(dt) {
        if (this.state === 'idle') {
            this.idleAnimation.frameTimer += dt;
            if (this.idleAnimation.frameTimer >= this.idleAnimation.frameSpeed) {
                this.idleAnimation.frameTimer = 0;
                this.idleAnimation.currentFrame = (this.idleAnimation.currentFrame + 1) % this.idleAnimation.frameCount;
            }
        } else if (this.state === 'hit') {
            this.hitAnimation.frameTimer += dt;
            if (this.hitAnimation.frameTimer >= this.hitAnimation.frameSpeed) {
                this.hitAnimation.frameTimer = 0;
                this.hitAnimation.currentFrame++;
                if (this.hitAnimation.currentFrame >= this.hitAnimation.frameCount) {
                    this.state = 'respawning';
                    this.respawnTimer = this.RESPAWN_DURATION;
                }
            }
        } else if (this.state === 'respawning') {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                this._resetToIdle();
            }
        }
    }

    /**
     * Renders the arrow bubble based on its state and direction. It will not render while respawning.
     * @param {CanvasRenderingContext2D} ctx The rendering context.
     * @param {object} assets The game's asset manager.
     * @param {Camera} camera The game camera.
     */
    render(ctx, assets, camera) {
        if (this.state === 'respawning') return;

        const worldX = this.x - this.width / 2;
        const worldY = this.y - this.height / 2;
        if (!camera.isVisible(worldX, worldY, this.width, this.height)) {
            return;
        }

        const sprite = this.state === 'idle' ? assets.arrow_idle : assets.arrow_hit;
        const frame = this.state === 'idle' ? this.idleAnimation.currentFrame : this.hitAnimation.currentFrame;
        const frameCount = this.state === 'idle' ? this.idleAnimation.frameCount : this.hitAnimation.frameCount;

        if (sprite) {
            const frameWidth = sprite.width / frameCount;
            const frameHeight = sprite.height;

            ctx.save();
            ctx.translate(this.x, this.y);

            let angle = 0;
            switch (this.direction) {
                case 'up': angle = 0; break;
                case 'right': angle = Math.PI / 2; break;
                case 'down': angle = Math.PI; break;
                case 'left': default: angle = -Math.PI / 2; break;
            }
            ctx.rotate(angle);

            ctx.drawImage(
                sprite,
                frame * frameWidth, 0,
                frameWidth, frameHeight,
                -this.width / 2, -this.height / 2,
                this.width, this.height
            );

            ctx.restore();
        }
    }

    /**
     * Handles collision with the player, popping the bubble and starting the respawn timer.
     * @param {object} player A simplified object containing player data.
     * @param {object} eventBus The global event bus.
     */
    onCollision(player, eventBus) {
        if (this.state !== 'idle') return;

        const ctrl = player.entityManager.getComponent(player.entityId, PlayerControlledComponent);
        if (!ctrl) return;

        this.state = 'hit';
        this.hitAnimation.currentFrame = 0;
        this.hitAnimation.frameTimer = 0;
        
        eventBus.publish('playSound', { key: 'arrow_pop', volume: 0.8, channel: 'SFX' });

        const { vel } = player;
        const isVertical = this.direction === 'up' || this.direction === 'down';

        if (isVertical) {
            ctrl.vLock = true;
            vel.vx = 0;
        } else {
            ctrl.hLock = true;
            vel.vy = 0;
        }

        switch (this.direction) {
            case 'up':
                vel.vy = -this.knockbackSpeed;
                break;
            case 'down':
                vel.vy = this.knockbackSpeed;
                break;
            case 'left':
                vel.vx = -this.knockbackSpeed;
                break;
            case 'right':
                vel.vx = this.knockbackSpeed;
                break;
        }
    }

    /**
     * A helper method to restore the bubble to its interactive state.
     */
    _resetToIdle() {
        this.state = 'idle';
        this.idleAnimation.currentFrame = 0;
        this.idleAnimation.frameTimer = 0;
        this.hitAnimation.currentFrame = 0;
        this.hitAnimation.frameTimer = 0;
        this.respawnTimer = 0;
    }

    /**
     * Resets the bubble to its initial state for a level restart.
     */
    reset() {
        this._resetToIdle();
    }
}