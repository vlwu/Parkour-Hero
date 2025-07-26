import { BaseAI } from './BaseAI.js';
import { eventBus } from '../utils/event-bus.js';

export class SnailAI extends BaseAI {
    update(dt) {
        if (this.enemy.snailState === 'shell') {
            this._updateShellAI(dt);
        } else {
            this._updateWalkingAI(dt);
        }
    }

    _updateWalkingAI(dt) {
        const speed = this.enemy.ai.patrolSpeed;
        this.state.currentState = 'patrol';
        this.renderable.animationState = 'walk';
        this.vel.vx = this.renderable.direction === 'right' ? speed : -speed;

        const groundProbeX = this.renderable.direction === 'right' ? this.pos.x + this.col.width : this.pos.x;
        const groundProbeY = this.pos.y + this.col.height + 1;
        const isGroundSolidAhead = this.level.isSolidAt(groundProbeX, groundProbeY, true);
        const atEdge = !isGroundSolidAhead;

        const wallProbeX = this.renderable.direction === 'right' ? this.pos.x + this.col.width + 1 : this.pos.x - 1;
        const wallProbeY = this.pos.y + this.col.height / 2;
        const hitWall = this.level.isSolidAt(wallProbeX, wallProbeY, true);

        if (atEdge || hitWall) {
            this.renderable.direction = (this.renderable.direction === 'right' ? 'left' : 'right');
        }
    }

    _updateShellAI(dt) {
        const speed = this.enemy.ai.shellSpeed;

        switch (this.state.currentState) {
            case 'shell_patrol':
                this.renderable.animationState = 'shell_idle';
                this.vel.vx = this.renderable.direction === 'right' ? speed : -speed;

                const wallProbeX = this.renderable.direction === 'right' ? this.pos.x + this.col.width + 1 : this.pos.x - 1;
                const wallProbeY = this.pos.y + this.col.height / 2;
                const wallAhead = this.level.getTileAt(wallProbeX, wallProbeY);
                const hitWall = wallAhead.solid && !wallAhead.oneWay;

                if (hitWall) {
                    this.renderable.direction = (this.renderable.direction === 'right' ? 'left' : 'right');
                    this.state.currentState = 'shell_hit_wall';
                    this.renderable.animationState = 'shell_wall_hit';
                    this.renderable.animationFrame = 0;
                    this.enemy.timer = 0.2; // Stun duration after hitting wall
                    eventBus.publish('playSound', { key: 'snail_wall_hit', volume: 0.5, channel: 'SFX' });
                }
                break;

            case 'shell_hit_wall':
                this.vel.vx = 0;
                this.enemy.timer -= dt;
                if (this.enemy.timer <= 0) {
                    this.state.currentState = 'shell_patrol';
                }
                break;
        }
    }
}