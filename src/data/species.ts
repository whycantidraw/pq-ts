import { StatType } from "./data/enums";

interface SpeciesModel {
    name: string;
    attr: StatType[]; //replace with enum of stats
}

class Species implements SpeciesModel {
    name: string;
    attr: StatType[];

    constructor(name: string, attr: StatType[]) {
        this.name = name;
        this.attr = attr;
    }
}

export const species = [
    new Species("Half Orc", [StatType.hp_max]),
    new Species("Half Man", [StatType.charisma]),
    new Species("Half Halfling", [StatType.dexterity]),
    new Species("Double Hobbit", [StatType.strength]),
    new Species("Hob-Hobbit", [StatType.dexterity, StatType.condition]),
    new Species("Low Elf", [StatType.condition]),
    new Species("Dung Elf", [StatType.wisdom]),
    new Species("Talking Pony", [StatType.mp_max, StatType.intelligence]),
    new Species("Gyrognome", [StatType.dexterity]),
    new Species("Lesser Dwarf", [StatType.condition]),
    new Species("Crested Dwarf", [StatType.charisma]),
    new Species("Eel Man", [StatType.dexterity]),
    new Species("Panda Man", [StatType.condition, StatType.strength]),
    new Species("Trans-Kobold", [StatType.wisdom]),
    new Species("Enchanted Motorcycle", [StatType.mp_max]),
    new Species("Will o' the Wisp", [StatType.wisdom]),
    new Species("Battle-Finch", [StatType.dexterity, StatType.intelligence]),
    new Species("Double Wookiee", [StatType.strength]),
    new Species("Skraeling", [StatType.wisdom]),
    new Species("Demicanadian", [StatType.condition]),
    new Species("Land Squid", [StatType.strength, StatType.hp_max]),
]