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

        // Determine patrol boundaries and current position
        const leftBound = this.anchorX - this.patrolDistance / 2;
        const rightBound = this.anchorX + this.patrolDistance / 2;
        const currentXCenter = this.pos.x + this.col.width / 2;

        // --- REFACTORED ACCELERATION & DECELERATION LOGIC ---
        const slowDownDistance = 60; // Start slowing down 60px from the edge
        let targetSpeed = this.horizontalSpeed; // Assume full speed initially

        // If in the slowdown zone, adjust the target speed based on proximity to the edge.
        if (directionMultiplier > 0 && (rightBound - currentXCenter) < slowDownDistance) {
            const speedMultiplier = Math.max(0.1, (rightBound - currentXCenter) / slowDownDistance);
            targetSpeed *= speedMultiplier;
        } else if (directionMultiplier < 0 && (currentXCenter - leftBound) < slowDownDistance) {
            const speedMultiplier = Math.max(0.1, (currentXCenter - leftBound) / slowDownDistance);
            targetSpeed *= speedMultiplier;
        }

        const finalTargetSpeed = targetSpeed * directionMultiplier;

        // Use acceleration to smoothly approach the current target speed (whether it's for speeding up, cruising, or slowing down).
        if (this.vel.vx < finalTargetSpeed && directionMultiplier > 0) {
            this.vel.vx = Math.min(finalTargetSpeed, this.vel.vx + this.acceleration * dt);
        } else if (this.vel.vx > finalTargetSpeed && directionMultiplier < 0) {
            this.vel.vx = Math.max(finalTargetSpeed, this.vel.vx - this.acceleration * dt);
        } else {
             // For cruising or when deceleration is active, directly set the velocity toward the target.
            this.vel.vx = finalTargetSpeed;
        }
        
        // Check if the bird has reached or passed the end of its path
        if ((directionMultiplier > 0 && currentXCenter >= rightBound) || (directionMultiplier < 0 && currentXCenter <= leftBound)) {
            // Snap position to the boundary to prevent overshooting
            this.pos.x = directionMultiplier > 0 ? (rightBound - this.col.width / 2) : (leftBound - this.col.width / 2);
            this.vel.vx = 0;
            this.state.currentState = 'turning';
            this.enemy.turnTimer = this.turnDuration;
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