import { BaseAI } from './BaseAI.js';
import { GroundPatrol } from './GroundPatrol.js';
import { eventBus } from '../utils/event-bus.js';
import { ENEMY_DEFINITIONS } from '../entities/enemy-definitions.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { ENEMY_STATES, ANIMATION_STATES, DIRECTIONS, EVENTS } from '../utils/constants.js';

export class TrunkAI extends BaseAI {
    constructor(entityId, entityManager, level, playerEntityId) {
        super(entityId, entityManager, level, playerEntityId);
        this.groundPatrol = new GroundPatrol(entityId, entityManager, level, playerEntityId);

        this.aggroRadius = this.enemy.ai.aggroRadius || 175;
        this.attackInterval = this.enemy.ai.attackInterval || 2.0;

        this.attackTimer = this.attackInterval * Math.random();
        this.hasFired = false;
        this.state.currentState = ENEMY_STATES.PATROL;
    }

    update(dt) {
        if (this.state.currentState !== ENEMY_STATES.ATTACKING) {
            this.groundPatrol.update(dt);
        }

        switch (this.state.currentState) {
            case ENEMY_STATES.IDLE:
            case ENEMY_STATES.PATROL:
            case ENEMY_STATES.IDLE_GROUNDED:
            case ENEMY_STATES.PATROL_GROUNDED:
                this.renderable.animationState = this.state.currentState.startsWith('patrol') ? ANIMATION_STATES.RUN : ANIMATION_STATES.IDLE;
                this.attackTimer -= dt;
                if (this.attackTimer <= 0 && this._isPlayerInRange()) {
                    this.state.currentState = ENEMY_STATES.ATTACKING;
                    this.renderable.animationState = ANIMATION_STATES.ATTACK;
                    this.renderable.animationFrame = 0;
                    this.renderable.animationTimer = 0;
                    this.hasFired = false;
                }
                break;
            case ENEMY_STATES.ATTACKING:
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

        if (!onSamePlatform) {
            return false;
        }

        const playerCenterY = playerPos.y + playerCol.height / 2;
        const trunkCenterY = this.pos.y + this.col.height / 2;
        if (Math.abs(playerCenterY - trunkCenterY) > this.col.height * 1.5) {
            return false;
        }


        const playerCenterX = playerPos.x + playerCol.width / 2;
        const trunkCenterX = this.pos.x + this.col.width / 2;
        const dx = playerCenterX - trunkCenterX;
        const distance = Math.abs(dx);
        if (distance > this.aggroRadius) {
            return false;
        }

        const isPlayerRight = dx > 0;
        const isFacingPlayer = (isPlayerRight && this.renderable.direction === DIRECTIONS.RIGHT) || (!isPlayerRight && this.renderable.direction === DIRECTIONS.LEFT);

        return isFacingPlayer;
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
            this.state.currentState = ENEMY_STATES.PATROL;
            this.attackTimer = this.attackInterval;
        }
    }

    _fireBullet() {
        const speed = this.enemy.ai.bullet.speed;
        const directionMultiplier = this.renderable.direction === DIRECTIONS.RIGHT ? 1 : -1;
        const bulletConfig = this.enemy.ai.bullet;

        const bulletSpawnX = this.pos.x + (this.col.width / 2) + (directionMultiplier * ((this.col.width / 2) + (bulletConfig.width / 2) + 2));
        const bulletSpawnY = this.pos.y + 10;

        const velX = directionMultiplier * speed;
        const velY = 0;
        const rotation = this.renderable.direction === DIRECTIONS.RIGHT ? Math.PI : 0;

        eventBus.publish(EVENTS.SPAWN_BULLET, {
            x: bulletSpawnX,
            y: bulletSpawnY,
            vx: velX,
            vy: velY,
            rotation: rotation,
            config: bulletConfig,
            spriteKey: 'trunk_bullet',
            piecesSpriteKey: 'trunk_bullet_pieces'
        });
        eventBus.publish(EVENTS.PLAY_SOUND, { key: 'bullet_shoot', volume: 0.5, channel: 'SFX' });
    }
}