import { randomInt, below, belowLow, odds, choice } from "../common/common";
import { EquipmentType, StatType } from "../data/enums";
import {
    offensivePositiveModifiers,
    offensiveNegativeModifiers,
    defensivePositiveModifiers,
    defensiveNegativeModifiers,
} from "../data/modifiers";
import { spellList } from "../data/spells";
import { Bar } from "./bars";
import { Equipment, weapons, shields, armour } from "./equipment";
import { specialItem } from "./generation";
import { Inventory } from "./inventory";
import { QuestBook, Task } from "./quests";
import { SpellBook } from "./spells";
import { Stats } from "./stats";

type Quality = { name: string; quality: number };

function levelUpTime(level: number): number {
    return 20 * level * 60;
}

// Pick an equipment/modifier preset whose quality is closest to goal.
function pickEquipment<T extends Quality>(source: T[], goal: number): T {
    let result = choice(source);
    for (let i = 0; i < 5; i++) {
        const alternative = choice(source);
        if (Math.abs(goal - alternative.quality) < Math.abs(goal - result.quality)) {
            result = alternative;
        }
    }
    return result;
}

export class Player {
    name: string;
    birthday: Date;
    species: string
    class: string;
    stats: Stats;
    elapsed: number;
    expBar: Bar;
    level: number;
    spellBook: SpellBook;
    equipment: Equipment;
    questBook: QuestBook;
    inventory: Inventory;
    taskBar: Bar;
    task: Task | null;
    taskQueue: Task[];

    constructor(name: string, birthday: Date, species: string, playerClass: string, stats: Map<StatType, number>) {
        this.name = name;
        this.birthday = birthday;
        this.species = species;
        this.class = playerClass;
        this.stats = new Stats(stats);
        this.elapsed = 0.0;

        this.expBar = new Bar(levelUpTime(1));
        this.level = 1;

        this.questBook = new QuestBook();
        this.inventory = new Inventory(10+(this.stats.stats.get(StatType.strength) || 0));
        this.equipment = new Equipment();
        this.spellBook = new SpellBook();

        this.taskBar = new Bar(1);
        this.task = null;
        this.taskQueue = [];
    }

    setTask(task: Task) {
        this.task = task;
        this.taskBar.reset(task.duration);
        //logger.info("%s...", task.description)
        return ["start_task", task];
    }

    equipPrice() {
        return 5 * (this.level**2) + (10 * this.level) + 20;
    }

    levelUp(){
        this.level += 1;
        //logger.info("Leveled up to level %d!", this.level)
        this.stats.increment(StatType.hp_max, (Math.floor(this.stats.stats.get(StatType.condition) || 0)/3) + randomInt(5, 1));
        this.stats.increment(StatType.mp_max, (Math.floor(this.stats.stats.get(StatType.intelligence) || 0)/3) + randomInt(5, 1));
        this.winStat();
        this.winStat();
        this.winSpell();
        this.expBar.reset(levelUpTime(this.level));
        return ["level_up", this.level];
    }

    winStat() {
        let chosenStat: StatType;
        if (odds(1, 2)) {
            chosenStat = choice(Object.values(StatType));
        } else {
            // favor the best stat so it will tend to clump
            let t = 0;
            for (const value of this.stats.stats.values()) {
                t += value ** 2;
            }
            t = below(t);
            chosenStat = StatType.strength;
            for (const [stat, value] of this.stats.stats) {
                chosenStat = stat;
                t -= value ** 2;
                if (t < 0) {
                    break;
                }
            }
        }

        this.stats.increment(chosenStat, 1);
        if (chosenStat === StatType.strength) {
            this.inventory.capacity = 10 + (this.stats.stats.get(StatType.strength) || 0);
        }
        return ["win_stat", chosenStat];
    }

    winEquipment() {
        const slot = choice(Object.values(EquipmentType));

        let stuff: Quality[];
        let better: Quality[];
        let worse: Quality[];

        if (slot === EquipmentType.weapon) {
            stuff = weapons;
            better = offensivePositiveModifiers;
            worse = offensiveNegativeModifiers;
        } else {
            stuff = slot === EquipmentType.shield ? shields : armour;
            better = defensivePositiveModifiers;
            worse = defensiveNegativeModifiers;
        }

        const equipment = pickEquipment(stuff, this.level);
        let name = equipment.name;
        let plus = this.level - equipment.quality;
        const modifierPool = plus < 0 ? worse : better;
        let count = 0;
        while (count < 2 && plus !== 0) {
            const modifier = choice(modifierPool);
            if (name.includes(modifier.name)) {
                break; // no repeats
            }
            if (Math.abs(plus) < Math.abs(modifier.quality)) {
                break; // too much
            }
            name = modifier.name + " " + name;
            plus -= modifier.quality;
            count += 1;
        }

        if (plus < 0) {
            name = `${plus} ${name}`;
        }
        if (plus > 0) {
            name = `+${plus} ${name}`;
        }

        return this.equipment.put(slot, name);
    }

    winSpell() {
        const wisdom = this.stats.stats.get(StatType.wisdom) || 0;
        const index = belowLow(Math.min(wisdom + this.level, spellList.length));
        return this.spellBook.addSpell(spellList[index]!, 1);
    }

    winItem() {
        return this.inventory.addItem(specialItem(), 1);
    }

}