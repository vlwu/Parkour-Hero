import { MovementPatternComponent } from '../components/MovementPatternComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';

export class TrapMovementSystem {
    update(dt, { entityManager }) {
        const movingEntities = entityManager.query([MovementPatternComponent, PositionComponent]);

        for (const entityId of movingEntities) {
            const move = entityManager.getComponent(entityId, MovementPatternComponent);
            const pos = entityManager.getComponent(entityId, PositionComponent);

            switch (move.type) {
                case 'circular':
                    move.angle += move.speed * dt;
                    pos.x = move.center.x + Math.cos(move.angle) * move.radius;
                    pos.y = move.center.y + Math.sin(move.angle) * move.radius;
                    break;

                case 'pendulum':
                    // speed here is angular velocity (radians/sec)
                    move.angle += move.speed * move.direction * dt;
                    const halfArc = move.arc / 2;
                    if (move.angle > halfArc || move.angle < -halfArc) {
                        move.direction *= -1; // Reverse direction
                        move.angle = Math.max(-halfArc, Math.min(halfArc, move.angle)); // Clamp
                    }
                    pos.x = move.center.x + Math.sin(move.angle) * move.radius;
                    pos.y = move.center.y + Math.cos(move.angle) * move.radius;
                    break;
                
                // Other cases like 'linear' or 'path' can be added here.
            }
        }
    }
}