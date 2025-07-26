import { BaseAI } from './BaseAI.js';

export class PatrolAI extends BaseAI {
    update(dt) {
        const speed = this.enemy.ai.patrolSpeed;

        if (this.state.currentState === 'idle') {
            this.renderable.animationState = this.enemy.type === 'slime' ? 'idle_run' : 'idle';
        } else {
            this.renderable.animationState = this.enemy.type === 'slime' ? 'idle_run' : 'run';
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
                const groundAhead = this.level.getTileAt(groundProbeX, groundProbeY);
                const atEdge = !groundAhead.solid || groundAhead.oneWay;

                const wallProbeX = this.renderable.direction === 'right'
                    ? this.pos.x + this.col.width + 1
                    : this.pos.x - 1;
                const wallProbeY = this.pos.y + this.col.height / 2;
                const wallAhead = this.level.getTileAt(wallProbeX, wallProbeY);
                const hitWall = wallAhead.solid && !wallAhead.oneWay;

                if (atEdge || hitWall) {
                    this.renderable.direction = (this.renderable.direction === 'right' ? 'left' : 'right');
                    this.state.currentState = 'idle';
                    this.enemy.timer = 0.5; // Turn around delay
                }
                break;
        }
    }
}