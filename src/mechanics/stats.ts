import { logger } from "../common/logger";
import { StatType, primeStats } from "../data/enums";

export class Stats{
    stats: Map<StatType, number>;

    constructor(values: Map<StatType, number>) {
        this.stats = values
    }

    // The highest of all stats (including HP/MP max). Ties keep the first seen.
    best(): StatType {
        let bestStat: StatType | undefined;
        let bestValue = -Infinity;
        for (const [stat, value] of this.stats) {
            if (value > bestValue) {
                bestStat = stat;
                bestValue = value;
            }
        }
        return bestStat!;
    }

    // The highest of the prime stats only. Ties keep the first seen.
    bestPrime(): StatType {
        let bestStat: StatType | undefined;
        let bestValue = -Infinity;
        for (const [stat, value] of this.stats) {
            if (primeStats.includes(stat) && value > bestValue) {
                bestStat = stat;
                bestValue = value;
            }
        }
        return bestStat!;
    }

    increment(stat: StatType, quantity: number) {
        this.stats.set(stat, (this.stats.get(stat) || 0) + quantity);
        logger.info(`Increased ${stat} to ${this.stats.get(stat)}`);
    }
}