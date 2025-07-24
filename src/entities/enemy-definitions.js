export const ENEMY_DEFINITIONS = {
    // --- Section 1: Mechanical Mastery (Ground-based) ---
    mushroom: {
        width: 32,
        height: 32,
        spriteKey: 'enemy_mushroom', // Base key for assets
        animations: {
            run: { frameCount: 16, speed: 0.1 },
            death: { frameCount: 4, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 300,
        },
        ai: {
            type: 'patrol',
            aggroRange: 0, // Doesn't react to the player
            patrolSpeed: 40,
        }
    },
    angry_boar: {
        width: 44,
        height: 26,
        spriteKey: 'enemy_boar',
        animations: {
            run: { frameCount: 6, speed: 0.1 },
            charge: { frameCount: 5, speed: 0.08 },
            death: { frameCount: 1, speed: 1 } // single frame death
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 250,
        },
        ai: {
            type: 'charge',
            aggroRange: 250,
            patrolSpeed: 30,
            chargeSpeed: 250,
        }
    },
    spiky_snail: {
        width: 34,
        height: 24,
        spriteKey: 'enemy_snail',
        animations: {
            run: { frameCount: 8, speed: 0.15 },
            death: { frameCount: 1, speed: 1 }
        },
        killable: {
            stompable: false, // Player gets hurt if they stomp
        },
        ai: {
            type: 'patrol',
            aggroRange: 0,
            patrolSpeed: 20,
        }
    },
    hopping_slime: {
        width: 32,
        height: 25,
        spriteKey: 'enemy_slime',
        animations: {
            idle: { frameCount: 9, speed: 0.1 },
            jump: { frameCount: 5, speed: 0.1 },
            death: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 350,
        },
        ai: {
            type: 'hop',
            hopInterval: 2.0, // Hops every 2 seconds
            hopSpeed: 100,
            hopHeight: 250,
        }
    },
    rock_golem: {
        width: 28,
        height: 28,
        spriteKey: 'enemy_golem',
        animations: {
            idle: { frameCount: 4, speed: 0.2 },
            attack: { frameCount: 5, speed: 0.1 },
            death: { frameCount: 6, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 250,
        },
        ai: {
            type: 'ranged',
            aggroRange: 300,
            attackInterval: 3.0, // Shoots every 3 seconds when player is in range
        }
    },

    // --- Section 2: Sky High (Flying) ---
    bluebird: {
        width: 32,
        height: 32,
        spriteKey: 'enemy_bluebird',
        animations: {
            run: { frameCount: 9, speed: 0.1 },
            death: { frameCount: 1, speed: 1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 300,
        },
        ai: {
            type: 'fly_patrol', // A new AI type for flying enemies
            aggroRange: 0,
            patrolSpeed: 70,
        }
    },
    swooping_bat: {
        width: 46,
        height: 30,
        spriteKey: 'enemy_bat',
        animations: {
            idle: { frameCount: 7, speed: 0.15 }, // Hanging from ceiling
            run: { frameCount: 5, speed: 0.1 },  // Flying
            death: { frameCount: 1, speed: 1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 300,
        },
        ai: {
            type: 'swoop',
            aggroRange: 400, // Detection range below it
            swoopSpeed: 300,
        }
    },
    cloud_spirit: {
        width: 32,
        height: 32,
        spriteKey: 'enemy_cloud',
        animations: {
            run: { frameCount: 9, speed: 0.15 },
            death: { frameCount: 9, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 300,
        },
        ai: {
            type: 'drift', // A new AI for ghost-like movement
            aggroRange: 0,
            driftSpeed: 30,
            collidesWithTerrain: false, // Can pass through walls
        }
    },
    angry_wasp: {
        width: 36,
        height: 34,
        spriteKey: 'enemy_wasp',
        animations: {
            idle: { frameCount: 4, speed: 0.1 },
            run: { frameCount: 4, speed: 0.08 },
            death: { frameCount: 1, speed: 1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 300,
        },
        ai: {
            type: 'homing_charge',
            aggroRange: 350,
            chargeSpeed: 280,
            chargeDuration: 1.0,
            cooldown: 2.0,
        }
    },
    air_cannon: {
        width: 24,
        height: 24,
        spriteKey: 'enemy_cannon',
        animations: {
            idle: { frameCount: 1, speed: 1 },
            attack: { frameCount: 8, speed: 0.1 },
            death: { frameCount: 5, speed: 0.1 }
        },
        killable: {
            stompable: true,
            stompBounceVelocity: 250,
        },
        ai: {
            type: 'turret',
            aggroRange: 400,
            attackInterval: 2.5,
        }
    }
};