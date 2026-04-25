import { EquipmentType } from "../data/enums";
import { shieldsList, weaponsList, armourList } from "../data/equipment";

interface EquipmentModel {
    name: string;
    quality: number;
}

class EquipmentPreset implements EquipmentModel {
    name: string;
    quality: number;

    constructor(name: string, quality: number) {
        this.name = name;
        this.quality = quality;
    }
}

export const shields = shieldsList.map((shield) => new EquipmentPreset(shield.name, shield.quality));
export const weapons = weaponsList.map((weapon) => new EquipmentPreset(weapon.name, weapon.quality));
export const armour = armourList.map((piece) => new EquipmentPreset(piece.name, piece.quality));

export class Equipment {
    items: Map<EquipmentType, string>;

    constructor(items: Map<EquipmentType, string> = new Map([[EquipmentType.weapon, "Sharp Rock"], [EquipmentType.hauberk, "-3 Burlap" ]])) {
        this.items = items;
    }

    put(){}
}