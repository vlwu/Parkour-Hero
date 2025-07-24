export class KillableComponent {
    constructor({ stompable = true, stompBounceVelocity = 250, dealsContactDamage = true } = {}) {
        this.stompable = stompable;
        this.stompBounceVelocity = stompBounceVelocity;
        this.dealsContactDamage = dealsContactDamage;
    }
}