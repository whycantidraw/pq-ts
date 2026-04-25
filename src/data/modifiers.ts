interface ModifierModel {
    name: string;
    quality: number;
}

class Modifier implements ModifierModel {
    name: string;
    quality: number;

    constructor(name: string, quality: number) {
        this.name = name;
        this.quality = quality;
    }
}

export const offensivePositiveModifiers = [
    new Modifier("Polished", 1),
    new Modifier("Serrated", 1),
    new Modifier("Heavy", 1),
    new Modifier("Pronged", 2),
    new Modifier("Steely", 2),
    new Modifier("Vicious", 3),
    new Modifier("Venomed", 4),
    new Modifier("Stabbity", 4),
    new Modifier("Dancing", 5),
    new Modifier("Invisible", 6),
    new Modifier("Vorpal", 7),
];

export const defensivePositiveModifiers = [
    new Modifier("Studded", 1),
    new Modifier("Banded", 2),
    new Modifier("Gilded", 2),
    new Modifier("Festooned", 3),
    new Modifier("Holy", 4),
    new Modifier("Cambric", 1),
    new Modifier("Fine", 4),
    new Modifier("Impressive", 5),
    new Modifier("Custom", 3),
];

export const offensiveNegativeModifiers = [
    new Modifier("Dull", -2),
    new Modifier("Tarnished", -1),
    new Modifier("Rusty", -3),
    new Modifier("Padded", -5),
    new Modifier("Bent", -4),
    new Modifier("Mini", -4),
    new Modifier("Rubber", -6),
    new Modifier("Nerf", -7),
    new Modifier("Unbalanced", -2),
];

export const defensiveNegativeModifiers = [
    new Modifier("Holey", -1),
    new Modifier("Patched", -1),
    new Modifier("Threadbare", -2),
    new Modifier("Faded", -1),
    new Modifier("Rusty", -3),
    new Modifier("Motheaten", -3),
    new Modifier("Mildewed", -2),
    new Modifier("Torn", -3),
    new Modifier("Dented", -3),
    new Modifier("Cursed", -5),
    new Modifier("Plastic", -4),
    new Modifier("Cracked", -4),
    new Modifier("Warped", -3),
    new Modifier("Corroded", -3),
];
