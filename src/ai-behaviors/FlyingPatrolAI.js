import { BaseAI } from './BaseAI.js';
import { eventBus } from '../utils/event-bus.js';

export class FlyingPatrolAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);

        // Store the initial anchor point for the patrol path
        this.anchorX = this.pos.x + this.col.width / 2;
        this.anchorY = this.pos.y;
        
        // AI parameters from the definition
        this.patrolDistance = this.enemy.ai.patrolDistance || 200;
        this.horizontalSpeed = this.enemy.ai.horizontalSpeed || 60;
        this.verticalAmplitude = this.enemy.ai.verticalAmplitude || 10;
        this.verticalFrequency = this.enemy.ai.verticalFrequency || 2;
        
        this.turnDuration = 1.0; // Time to pause at the end of the path
        this.acceleration = 120; // Pixels/sec^2
        
        // Initialize internal state
        this.state.currentState = 'patrolling';
        this.enemy.timer = 0; // Will be used for turning and vertical bobbing
        this.lastFrame = -1; // To track animation frame changes
    }

    update(dt) {
        this.renderable.animationState = 'flying';

        this._handleParticles();

        switch (this.state.currentState) {
            case 'patrolling':
                this._patrol(dt);
                break;
            case 'turning':
                this._turn(dt);
                break;
        }

        // Apply vertical bobbing motion using a sine wave
        this.enemy.timer += dt;
        this.pos.y = this.anchorY + Math.sin(this.enemy.timer * this.verticalFrequency) * this.verticalAmplitude;
    }

    _patrol(dt) {
        const directionMultiplier = this.renderable.direction === 'right' ? 1 : -1;
        
        // Accelerate to max speed
        this.vel.vx = Math.min(this.horizontalSpeed, Math.abs(this.vel.vx) + this.acceleration * dt) * directionMultiplier;
        
        // Determine the patrol boundaries
        const leftBound = this.anchorX - this.patrolDistance / 2;
        const rightBound = this.anchorX + this.patrolDistance / 2;

        const currentXCenter = this.pos.x + this.col.width / 2;
        const distanceFromRight = rightBound - currentXCenter;
        const distanceFromLeft = currentXCenter - leftBound;

        const slowDownDistance = 50; // Start slowing down 50px from the edge

        // Decelerate when approaching the end of the path
        if ((directionMultiplier > 0 && distanceFromRight < slowDownDistance) || (directionMultiplier < 0 && distanceFromLeft < slowDownDistance)) {
            const distanceToEdge = directionMultiplier > 0 ? distanceFromRight : distanceFromLeft;
            const speedMultiplier = Math.max(0.1, distanceToEdge / slowDownDistance);
            this.vel.vx *= speedMultiplier;
        }

        // Check if the bird has reached the end of its path
        if ((directionMultiplier > 0 && currentXCenter >= rightBound) || (directionMultiplier < 0 && currentXCenter <= leftBound)) {
            this.pos.x = directionMultiplier > 0 ? (rightBound - this.col.width / 2) : (leftBound - this.col.width / 2);
            this.vel.vx = 0;
            this.state.currentState = 'turning';
            this.enemy.turnTimer = this.turnDuration; // Use a separate timer for turning
        }
    }

    _turn(dt) {
        this.enemy.turnTimer -= dt;
        if (this.enemy.turnTimer <= 0) {
            this.renderable.direction = this.renderable.direction === 'right' ? 'left' : 'right';
            this.state.currentState = 'patrolling';
        }
    }

    _handleParticles() {
        const currentFrame = this.renderable.animationFrame;
        // Check if the frame has changed and if it's the 6th frame (index 5)
        if (currentFrame !== this.lastFrame && currentFrame === 5) {
            const particleX = this.pos.x + this.col.width / 2;
            const particleY = this.pos.y + this.col.height; // Below the bird

            eventBus.publish('createParticles', {
                x: particleX,
                y: particleY,
                type: 'wing_flap',
            });
        }
        this.lastFrame = currentFrame;
    }
}