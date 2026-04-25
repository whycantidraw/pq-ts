import { randomInt } from "../common/common";
import { EquipmentType, StatType } from "../data/enums";
import { weaponsList } from "../data/equipment";
import { Bar } from "./bars";
import { Equipment } from "./equipment";
import { Inventory } from "./inventory";
import { QuestBook, Task } from "./quests";
import { SpellBook } from "./spells";
import { Stats } from "./stats";

function levelUpTime(level: number): number {
    return 20 * level * 60;
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
        let chosenStat: StatType | undefined
        const rand = Math.random() < 0.5
        if (rand) {
            const randIndex = randomInt(7);
            chosenStat = Object.values(StatType)[randIndex];
        } else {
            // boost heighest stat
        }
        // increment stat
        // update capacity if strength
    }

    winEquipment() {
        const chosenEquip: EquipmentType | undefined = Object.values(EquipmentType)[randomInt(11)]
        let stuff: any
        let better: any
        let worse: any

        if (chosenEquip === EquipmentType.weapon) {
            stuff = weaponsList;
        } else {

        }
        //let stuff: EquipmentPreset
        //let better: Modifier
        //let worse: Modifier
    }

    winSpell() {
        // spell list length equal to wisdom + level
        // pick spell from spell list
        // if spell is new and book not full, add spell to book
        // if spell is not new, increment
        // if spell is new and book is full, do nothing
    }

    winItem(){}

}