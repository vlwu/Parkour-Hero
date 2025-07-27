import { Trap } from './templates/Trap.js';
import { PlayerControlledComponent } from '../components/PlayerControlledComponent.js';




export class Fan extends Trap {





    constructor(x, y, config) {
        super(x, y, config);
        this.width = 24;
        this.height = 8;
        this.type = 'fan';

        this.direction = config.direction || 'right';
        this.pushStrength = config.pushStrength || 250;
        this.windHeight = config.windHeight || 120;
        this.soundRadius = config.soundRadius || 250;

        this.state = 'off';
        this.onDuration = 5;
        this.offDuration = 5;
        this.timer = this.offDuration;
        this.isSoundPlaying = false;

        this.onAnimation = {
            frameCount: 4,
            frameSpeed: 0.05,
            frameTimer: 0,
            currentFrame: 0,
        };

        this.particleTimer = 0;
    }





    get hitbox() {

        const bodyWidth = this.width;
        const bodyHeight = this.height;


        switch (this.direction) {
            case 'up':

                return {
                    x: this.x - bodyWidth / 2,
                    y: this.y - (bodyHeight / 2) - this.windHeight,
                    width: bodyWidth,
                    height: this.windHeight
                };
            case 'down':

                return {
                    x: this.x - bodyWidth / 2,
                    y: this.y + bodyHeight / 2,
                    width: bodyWidth,
                    height: this.windHeight
                };
            case 'left':


                return {
                    x: this.x - (bodyHeight / 2) - this.windHeight,
                    y: this.y - bodyWidth / 2,
                    width: this.windHeight,
                    height: bodyWidth
                };
            case 'right':
            default:

                return {
                    x: this.x + bodyHeight / 2,
                    y: this.y - bodyWidth / 2,
                    width: this.windHeight,
                    height: bodyWidth
                };
        }
    }







    update(dt, playerData, eventBus) {
        this.timer -= dt;

        if (this.timer <= 0) {
            if (this.state === 'off') {
                this.state = 'on';
                this.timer = this.onDuration;
            } else {
                this.state = 'off';
                this.timer = this.offDuration;
            }
        }

        if (this.state === 'on') {
            this.onAnimation.frameTimer += dt;
            if (this.onAnimation.frameTimer >= this.onAnimation.frameSpeed) {
                this.onAnimation.frameTimer = 0;
                this.onAnimation.currentFrame = (this.onAnimation.currentFrame + 1) % this.onAnimation.frameCount;
            }

            this.particleTimer += dt;
            if (this.particleTimer >= 0.05) {
                this.particleTimer = 0;
                eventBus.publish('createParticles', {
                    x: this.x,
                    y: this.y,
                    type: 'fan_push',
                    direction: this.direction,
                    particleSpeed: this.pushStrength * 0.75
                });
            }
        }

        const wasSoundPlaying = this.isSoundPlaying;
        let shouldSoundBePlaying = false;

        if (this.state === 'on' && playerData) {
            const distance = Math.sqrt(Math.pow(playerData.x - this.x, 2) + Math.pow(playerData.y - this.y, 2));
            if (distance < this.soundRadius) {
                shouldSoundBePlaying = true;
            }
        }

        if (shouldSoundBePlaying && !wasSoundPlaying) {
            eventBus.publish('startSoundLoop', { key: 'fan_blowing', volume: 0.7, channel: 'SFX' });
            this.isSoundPlaying = true;
        } else if (!shouldSoundBePlaying && wasSoundPlaying) {
            eventBus.publish('stopSoundLoop', { key: 'fan_blowing' });
            this.isSoundPlaying = false;
        }
    }


    onCollision(player) {
        if (this.state !== 'on') return;

        const ctrl = player.entityManager.getComponent(player.entityId, PlayerControlledComponent);
        if (!ctrl) return;

        const { vel } = player;
        const isVertical = this.direction === 'up' || this.direction === 'down';

        if (isVertical) {
            ctrl.vLock = true;
        } else {
            ctrl.hLock = true;
        }

        switch (this.direction) {
            case 'up':
                vel.vy = -this.pushStrength;
                break;
            case 'down':
                vel.vy = this.pushStrength;
                break;
            case 'left':
                vel.vx = -this.pushStrength;
                break;
            case 'right':
                vel.vx = this.pushStrength;
                break;
        }
    }




    reset(eventBus) {
        if (this.isSoundPlaying) {
            eventBus.publish('stopSoundLoop', { key: 'fan_blowing' });
        }
        this.state = 'off';
        this.timer = this.offDuration;
        this.isSoundPlaying = false;
        this.onAnimation.currentFrame = 0;
        this.onAnimation.frameTimer = 0;
    }
}