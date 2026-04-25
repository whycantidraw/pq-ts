import { StatType } from "./enums";

interface ClassModel {
    name: string;
    attr: StatType[];
}

class Class implements ClassModel {
    name: string;
    attr: StatType[];

    constructor(name: string, attr: StatType[]) {
        this.name = name;
        this.attr = attr;
    }
}

export const classes = [
    new Class("Ur-Paladin", [StatType.wisdom, StatType.condition]),
    new Class("Voodoo Princess", [StatType.intelligence, StatType.charisma]),
    new Class("Robot Monk", [StatType.strength]),
    new Class("Mu-Fu Monk", [StatType.dexterity]),
    new Class("Mage Illusioner", [StatType.intelligence, StatType.mp_max]),
    new Class("Shiv-Knight", [StatType.dexterity]),
    new Class("Inner Mason", [StatType.condition]),
    new Class("Fighter/Organist", [StatType.charisma, StatType.strength]),
    new Class("Puma Burgular", [StatType.dexterity]),
    new Class("Runeloremaster", [StatType.wisdom]),
    new Class("Hunter Strangler", [StatType.dexterity, StatType.intelligence]),
    new Class("Battle-Felon", [StatType.strength]),
    new Class("Tickle-Mimic", [StatType.wisdom, StatType.intelligence]),
    new Class("Slow Poisoner", [StatType.condition]),
    new Class("Bastard Lunatic", [StatType.condition]),
    new Class("Lowling", [StatType.wisdom]),
    new Class("Birdrider", [StatType.wisdom]),
    new Class("Vermineer", [StatType.intelligence]),
]