import { EquipmentType, StatType, TaskType } from "../data/enums";
import { Bar } from "../mechanics/bars";
import { Monster } from "../mechanics/monsters";
import { Player } from "../mechanics/player";
import { Task } from "../mechanics/quests";
import { Spell } from "../mechanics/spells";

// Plain-object shapes written to disk. The original pickled Python objects; we
// use JSON, so every class instance is flattened to and rebuilt from these.

interface BarJSON {
    max: number;
    position: number;
}

interface MonsterJSON {
    name: string;
    level: number;
    item?: string;
}

interface TaskJSON {
    description: string;
    duration: number;
    taskType: TaskType;
    monster: MonsterJSON | null;
}

export interface PlayerJSON {
    name: string;
    birthday: string;
    species: string;
    class: string;
    elapsed: number;
    level: number;
    stats: Record<string, number>;
    expBar: BarJSON;
    taskBar: BarJSON;
    task: TaskJSON | null;
    taskQueue: TaskJSON[];
    questBook: {
        quests: string[];
        act: number;
        monster: MonsterJSON | null;
        plotBar: BarJSON;
        questBar: BarJSON;
    };
    inventory: {
        gold: number;
        items: { name: string; quantity: number }[];
        capacity: number;
        encumbrance: number;
    };
    equipment: Record<string, string>;
    spellBook: { name: string; level: number }[];
}

function barToJSON(bar: Bar): BarJSON {
    return { max: bar.max, position: bar.position };
}

function loadBar(bar: Bar, json: BarJSON): void {
    bar.max = json.max;
    bar.position = json.position;
}

function monsterToJSON(monster: Monster | null | undefined): MonsterJSON | null {
    if (!monster) {
        return null;
    }
    return { name: monster.name, level: monster.level, item: monster.item };
}

function monsterFromJSON(json: MonsterJSON | null): Monster | undefined {
    if (!json) {
        return undefined;
    }
    return new Monster(json.name, json.level, json.item);
}

function taskToJSON(task: Task): TaskJSON {
    return {
        description: task.description,
        duration: task.duration,
        taskType: task.taskType,
        monster: monsterToJSON(task.monster),
    };
}

function taskFromJSON(json: TaskJSON): Task {
    return new Task(json.description, json.duration, json.taskType, monsterFromJSON(json.monster));
}

export function playerToJSON(player: Player): PlayerJSON {
    const stats: Record<string, number> = {};
    for (const [stat, value] of player.stats.stats) {
        stats[stat] = value;
    }

    const equipment: Record<string, string> = {};
    for (const [slot, name] of player.equipment.items) {
        equipment[slot] = name;
    }

    return {
        name: player.name,
        birthday: player.birthday.toISOString(),
        species: player.species,
        class: player.class,
        elapsed: player.elapsed,
        level: player.level,
        stats,
        expBar: barToJSON(player.expBar),
        taskBar: barToJSON(player.taskBar),
        task: player.task ? taskToJSON(player.task) : null,
        taskQueue: player.taskQueue.map(taskToJSON),
        questBook: {
            quests: player.questBook.quests,
            act: player.questBook.act,
            monster: monsterToJSON(player.questBook.monster),
            plotBar: barToJSON(player.questBook.plotBar),
            questBar: barToJSON(player.questBook.questBar),
        },
        inventory: {
            gold: player.inventory.gold,
            items: player.inventory.items.map((item) => ({ ...item })),
            capacity: player.inventory.encumbranceBar.max,
            encumbrance: player.inventory.encumbranceBar.position,
        },
        equipment,
        spellBook: player.spellBook.spells.map((spell) => ({ name: spell.name, level: spell.level })),
    };
}

export function playerFromJSON(json: PlayerJSON): Player {
    const statsMap = new Map<StatType, number>();
    for (const [stat, value] of Object.entries(json.stats)) {
        statsMap.set(stat as StatType, value);
    }

    const player = new Player(json.name, new Date(json.birthday), json.species, json.class, statsMap);
    player.elapsed = json.elapsed;
    player.level = json.level;

    loadBar(player.expBar, json.expBar);
    loadBar(player.taskBar, json.taskBar);

    player.task = json.task ? taskFromJSON(json.task) : null;
    player.taskQueue = json.taskQueue.map(taskFromJSON);

    player.questBook.quests = json.questBook.quests;
    player.questBook.act = json.questBook.act;
    player.questBook.monster = monsterFromJSON(json.questBook.monster) ?? null;
    loadBar(player.questBook.plotBar, json.questBook.plotBar);
    loadBar(player.questBook.questBar, json.questBook.questBar);

    player.inventory.gold = json.inventory.gold;
    player.inventory.items = json.inventory.items.map((item) => ({ ...item }));
    player.inventory.encumbranceBar.max = json.inventory.capacity;
    player.inventory.encumbranceBar.position = json.inventory.encumbrance;

    const equipment = new Map<EquipmentType, string>();
    for (const [slot, name] of Object.entries(json.equipment)) {
        equipment.set(slot as EquipmentType, name);
    }
    player.equipment.items = equipment;

    player.spellBook.spells = json.spellBook.map((spell) => new Spell(spell.name, spell.level));

    return player;
}
