export const ENEMY_DEFINITIONS = {
    // --- Section 1: Mechanical Mastery (Ground-based) ---
    mushroom: {
        width: 32,
        height: 32,
        spriteKey: 'mushroom',
        animations: {
            idle: { frameCount: 14, speed: 0.1 },
            run: { frameCount: 16, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 300,
        },
        ai: {
            type: 'patrol',
            aggroRange: 0,
            patrolSpeed: 40,
        }
    },
    chicken: {
        width: 32,
        height: 34,
        spriteKey: 'chicken',
        animations: {
            idle: { frameCount: 13, speed: 0.1 },
            run: { frameCount: 14, speed: 0.08 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 250,
        },
        ai: {
            type: 'ground_charge',
            aggroRange: 250,
            chargeSpeed: 200,
            idleTime: 1.5, // Time to wait before charging
            chargeTime: 2.0, // Duration of charge
            cooldownTime: 3.0, // Time after charge before returning to idle
        }
    },
    snail: {
        width: 38,
        height: 24,
        spriteKey: 'snail',
        animations: {
            walk: { frameCount: 10, speed: 0.15 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true, // It is stompable, but has a special effect
            stompBounceVelocity: 250,
        },
        ai: {
            type: 'patrol',
            aggroRange: 0,
            patrolSpeed: 20,
        }
    },
    slime: {
        width: 44,
        height: 30,
        spriteKey: 'slime',
        animations: {
            idle_run: { frameCount: 10, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 },
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 350,
        },
        ai: {
            type: 'hop',
            hopInterval: 2.0,
            hopSpeed: 100,
            hopHeight: 250,
        }
    },
    turtle: {
        width: 44,
        height: 26,
        spriteKey: 'turtle',
        animations: {
            idle1: { frameCount: 14, speed: 0.1 }, // Spikes in
            spikes_out: { frameCount: 8, speed: 0.1 },
            spikes_in: { frameCount: 8, speed: 0.1 },
            hit: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true, // Only when spikes are in
            stompBounceVelocity: 250,
        },
        ai: {
            type: 'defensive_cycle',
            spikesInDuration: 3.0,
            spikesOutDuration: 2.0,
        }
    },
};