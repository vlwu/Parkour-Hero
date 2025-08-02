import { BaseAI } from './BaseAI.js';
import { GroundPatrol } from './GroundPatrol.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';

export class TrunkAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);
        this.groundPatrol = new GroundPatrol(entityId, entityManager, level, playerEntityId);

        this.attackInterval = this.enemy.ai.attackInterval || 2.0;

        this.attackTimer = this.attackInterval * Math.random();
        this.hasFired = false;
        this.state.currentState = 'patrol';
    }

    update(dt) {
        if (this.state.currentState !== 'attacking') {
            this.groundPatrol.update(dt);
        }

        switch (this.state.currentState) {
            case 'idle':
            case 'patrol':
            case 'idle_grounded':
            case 'patrol_grounded':
                this.renderable.animationState = this.state.currentState.startsWith('patrol') ? 'run' : 'idle';
                this.attackTimer -= dt;
                if (this.attackTimer <= 0 && this._isPlayerInRange()) {
                    this.state.currentState = 'attacking';
                    this.renderable.animationState = 'attack';
                    this.renderable.animationFrame = 0;
                    this.renderable.animationTimer = 0;
                    this.hasFired = false;
                }
                break;
            case 'attacking':
                this._updateAttacking(dt);
                break;
        }
    }

    _isPlayerInRange() {
        const playerPos = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, PositionComponent) : null;
        if (!playerPos) return false;
        const playerCol = this.playerEntityId !== null ? this.entityManager.getComponent(this.playerEntityId, CollisionComponent) : null;
        if (!playerCol) return false;

        const enemyEdges = this._getPlatformEdgesForEntity(this.pos, this.col);
        const playerEdges = this._getPlatformEdgesForEntity(playerPos, playerCol);

        const onSamePlatform = enemyEdges && playerEdges && enemyEdges.left === playerEdges.left && enemyEdges.right === playerEdges.right;
        
        const verticalDistance = Math.abs((playerPos.y + playerCol.height / 2) - (this.pos.y + this.col.height / 2));
        const onSameLevel = verticalDistance < this.col.height * 1.5;

        if (!onSamePlatform || !onSameLevel) {
            return false;
        }

        const playerIsRight = playerPos.x > this.pos.x;
        const trunkIsFacingRight = this.renderable.direction === 'right';

        return (playerIsRight && trunkIsFacingRight) || (!playerIsRight && !trunkIsFacingRight);
    }

    _updateAttacking(dt) {
        this.vel.vx = 0;

        const attackAnim = ENEMY_DEFINITIONS.trunk.animations.attack;
        const fireFrame = attackAnim.fireFrame || 8;

        if (this.renderable.animationFrame >= fireFrame && !this.hasFired) {
            this.hasFired = true;
            this._fireBullet();
        }

        const animTimer = this.renderable.animationTimer + dt;
        if (this.renderable.animationFrame >= attackAnim.frameCount - 1 && animTimer >= attackAnim.speed) {
            this.state.currentState = 'patrol';
            this.attackTimer = this.attackInterval;
        }
    }

    _fireBullet() {
        const speed = this.enemy.ai.bullet.speed;
        const bulletConfig = this.enemy.ai.bullet;
        const bulletSpawnY = this.pos.y + 10;

        const directionMultiplier = this.renderable.direction === 'right' ? 1 : -1;

        const spawnOffset = (this.col.width / 2) + (bulletConfig.width / 2) + 1;
        const trunkCenterX = this.pos.x + this.col.width / 2;
        const bulletSpawnX = trunkCenterX + (directionMultiplier * spawnOffset);
        
        const velX = directionMultiplier * speed;
        const velY = 0;

        eventBus.publish('spawnBullet', {
            x: bulletSpawnX,
            y: bulletSpawnY,
            vx: velX,
            vy: velY,
            config: bulletConfig,
            spriteKey: 'trunk_bullet',
            piecesSpriteKey: 'trunk_bullet_pieces'
        });
        eventBus.publish('playSound', { key: 'bullet_shoot', volume: 0.5, channel: 'SFX' });
    }
}