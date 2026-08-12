import { below, seed } from "../common/common";
import { StatType, primeStats } from "../data/enums";
import { Player } from "./player";

// Rolls fresh stat blocks (3d6 per prime stat) and remembers history so the
// player can step back to the previous roll.
export class StatsBuilder {
    history: Map<StatType, number>[] = [];

    roll(): Map<StatType, number> {
        const values = new Map<StatType, number>();
        for (const stat of primeStats) {
            values.set(stat, 3 + below(6) + below(6) + below(6));
        }
        values.set(
            StatType.hp_max,
            below(8) + Math.floor((values.get(StatType.condition) || 0) / 6),
        );
        values.set(
            StatType.mp_max,
            below(8) + Math.floor((values.get(StatType.intelligence) || 0) / 6),
        );
        this.history.push(values);
        return values;
    }

    unroll(): Map<StatType, number> {
        if (this.history.length > 1) {
            this.history.pop();
        }
        return this.history[this.history.length - 1]!;
    }
}

export function statTotal(stats: Map<StatType, number>): number {
    let total = 0;
    for (const stat of primeStats) {
        total += stats.get(stat) || 0;
    }
    return total;
}

export function createPlayer(
    name: string,
    race: string,
    playerClass: string,
    stats: Map<StatType, number>,
): Player {
    const now = new Date();
    // Seed the generator from the character so a fresh character's adventure is
    // reproducible, mirroring the original create_player().
    seed(String(now.getTime()) + name);
    return new Player(name, now, race, playerClass, stats);
}
