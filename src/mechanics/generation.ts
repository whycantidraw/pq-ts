import { below, odds, choice, choiceLow } from "../common/common";
import {
    generateName,
    indefinite,
    sick,
    young,
    big,
    special,
} from "../common/lingo";
import { classes } from "../data/classes";
import { TaskType } from "../data/enums";
import { specials, itemAttributes, itemOfs, itemsMundane } from "../data/items";
import { species } from "../data/species";
import { titles, titlesImpressive } from "../data/titles";
import { Monster, monsterList } from "./monsters";
import { Task } from "./quests";

export function interestingItem(): string {
    return choice(itemAttributes) + " " + choice(specials);
}

export function specialItem(): string {
    return interestingItem() + " of " + choice(itemOfs);
}

export function boringItem(): string {
    return choice(itemsMundane);
}

export function impressiveGuy(): string {
    return (
        choice(titlesImpressive) +
        (below(2)
            ? " of the " + choice(species).name
            : " of " + generateName())
    );
}

// Pick the monster (out of several random draws) whose level is closest to the
// requested level.
export function unnamedMonster(level: number, iterations: number): Monster {
    let result = choice(monsterList);
    for (let i = 0; i < iterations; i++) {
        const alternative = choice(monsterList);
        if (Math.abs(level - alternative.level) < Math.abs(level - result.level)) {
            result = alternative;
        }
    }
    return result;
}

export function namedMonster(level: number): string {
    const monster = unnamedMonster(level, 4);
    return generateName() + " the " + monster.name;
}

// Build a kill task scaled to the player's level, occasionally spawning an NPC
// or the current quest monster, and decorating the name to reflect the level
// gap.
export function monsterTask(playerLevel: number, questMonster: Monster | null): Task {
    let level = playerLevel;
    for (let i = 0; i < playerLevel; i++) {
        if (odds(2, 5)) {
            level += below(2) * 2 - 1;
        }
    }
    if (level < 1) {
        level = 1;
    }

    let isDefinite = false;
    let monster: Monster | null = null;
    let result: string;
    let lev: number;

    if (odds(1, 25)) {
        // use an NPC every once in a while
        const race = choice(species);
        if (odds(1, 2)) {
            result = "passing " + race.name + " " + choice(classes).name;
        } else {
            result =
                choiceLow(titles) + " " + generateName() + " the " + race.name;
            isDefinite = true;
        }
        lev = level;
    } else if (questMonster && odds(1, 4)) {
        // use the quest monster
        monster = questMonster;
        result = monster.name;
        lev = monster.level;
    } else {
        // pick the monster closest to the level we want
        monster = unnamedMonster(level, 5);
        result = monster.name;
        lev = monster.level;
    }

    let qty = 1;
    if (level - lev > 10) {
        // lev is too low; multiply
        qty = Math.floor((level + below(Math.max(lev, 1))) / Math.max(lev, 1));
        if (qty < 1) {
            qty = 1;
        }
        level = Math.floor(level / qty);
    }

    if (level - lev <= -10) {
        result = "imaginary " + result;
    } else if (level - lev < -5) {
        let i = 10 + level - lev;
        i = 5 - below(i + 1);
        result = sick(i, young(lev - level - i, result));
    } else if (level - lev < 0 && below(2) === 1) {
        result = sick(level - lev, result);
    } else if (level - lev < 0) {
        result = young(level - lev, result);
    } else if (level - lev >= 10) {
        result = "messianic " + result;
    } else if (level - lev > 5) {
        let i = 10 - (level - lev);
        i = 5 - below(i + 1);
        result = big(i, special(level - lev - i, result));
    } else if (level - lev > 0 && below(2) === 1) {
        result = big(level - lev, result);
    } else if (level - lev > 0) {
        result = special(level - lev, result);
    }

    lev = level;
    level = lev * qty;
    if (!isDefinite) {
        result = indefinite(result, qty);
    }

    const duration = Math.floor((2 * 3 * level * 1000) / playerLevel);
    return new Task(`Executing ${result}`, duration, TaskType.kill, monster ?? undefined);
}
