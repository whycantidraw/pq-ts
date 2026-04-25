import { monsterList as list } from "../data/monsters";

interface MonsterModel {
    name: string;
    level: number;
    item?: string;
}

export class Monster implements MonsterModel {
    name: string;
    level: number;
    item?: string;

    constructor(name: string, level: number, item?: string) {
        this.name = name;
        this.level = level;
        this.item = item;
    }
}

export const monsterList: Monster[] = list.map(monster => new Monster(monster.name, monster.level, monster.item));