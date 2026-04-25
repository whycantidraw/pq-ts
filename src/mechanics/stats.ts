import type { StatType } from "../data/enums";

export class Stats{
    stats: Map<StatType, number>;

    constructor(values: Map<StatType, number>) {
        this.stats = values
    }

    best(){}

    bestPrime(){}

    increment(stat: StatType, quantity: number) {
        this.stats.set(stat, (this.stats.get(stat) || 0) + quantity);
        //logger.info("Increased %s to %d", stat.value, self[stat])
    }
}