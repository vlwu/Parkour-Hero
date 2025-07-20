export class VelocityComponent {
    /**
     * @param {number} vx The velocity on the x-axis.
     * @param {number} vy The velocity on the y-axis.
     */
    constructor(vx = 0, vy = 0) {
        this.vx = vx;
        this.vy = vy;
    }
}