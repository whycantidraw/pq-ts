export class Bar {
    position: number;
    max: number;

    constructor(max: number, position: number = 0.0) {
        this.max = max;
        this.position = position;
    }

    reset(newMax: number, position: number = 0.0) { // TODO: change logic to set position regardless, but only return change if two positions are far enough apart
        if (newMax === this.max && position === this.position) {
            return ["change", false];
        } else {
            this.max = newMax;
            this.position = position;
            return ["change", true];
        }
    }

    increment(){}

    reposition(newPosition: number){
        if (newPosition === this.position) {
            return ["change", false];
        } else {
            this.position = newPosition;
            return ["change", true];
        }
    }

    get complete(): boolean {
        return this.position >= this.max;
    }

}