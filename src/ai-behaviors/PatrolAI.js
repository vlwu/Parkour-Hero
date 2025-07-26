import { BaseAI } from './BaseAI.js';

export class PatrolAI extends BaseAI {
    update(dt) {
        const speed = this.enemy.ai.patrolSpeed;

        // Handle animation state based on enemy type and current AI state.
        if (this.enemy.type === 'slime') {
            // The slime uses a single animation for both idling and patrolling.
            this.renderable.animationState = 'idle_run';
        } else {
            // Other enemies like the mushroom switch between 'idle' and 'run'.
            this.renderable.animationState = this.state.currentState === 'patrol' ? 'run' : 'idle';
        }

        switch (this.state.currentState) {
            case 'idle':
                this.vel.vx = 0;
                this.enemy.timer -= dt;
                if (this.enemy.timer <= 0) {
                    this.state.currentState = 'patrol';
                }
                break;

            case 'patrol':
                this.vel.vx = this.renderable.direction === 'right' ? speed : -speed;

                const groundProbeX = this.renderable.direction === 'right'
                    ? this.pos.x + this.col.width
                    : this.pos.x;
                const groundProbeY = this.pos.y + this.col.height + 1;
                const isGroundSolidAhead = this.level.isSolidAt(groundProbeX, groundProbeY, true); // true to ignore one-way platforms
                const atEdge = !isGroundSolidAhead;

                const wallProbeX = this.renderable.direction === 'right'
                    ? this.pos.x + this.col.width + 1
                    : this.pos.x - 1;
                const wallProbeY = this.pos.y + this.col.height / 2;
                const hitWall = this.level.isSolidAt(wallProbeX, wallProbeY, true); // true to ignore one-way platforms

                if (atEdge || hitWall) {
                    this.renderable.direction = (this.renderable.direction === 'right' ? 'left' : 'right');
                    this.state.currentState = 'idle';
                    this.enemy.timer = 0.5; // Turn around delay
                }
                break;
        }
    }
}