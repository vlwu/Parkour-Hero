import { Trap } from './templates/Trap.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';




export class ArrowBubble extends Trap {





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



    _resetToIdle() {
        this.state = 'idle';
        this.idleAnimation.currentFrame = 0;
        this.idleAnimation.frameTimer = 0;
        this.hitAnimation.currentFrame = 0;
        this.hitAnimation.frameTimer = 0;
        this.respawnTimer = 0;
    }


    reset() {
        this._resetToIdle();
    }
}