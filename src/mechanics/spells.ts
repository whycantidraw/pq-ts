export { spellList } from "../data/spells";

interface SpellModel {
    name: string;
    level: number;
}

export class Spell implements SpellModel {
    name: string;
    level: number;

    constructor(name: string, level: number = 1) {
        this.name = name;
        this.level = level;
    }
}

export class SpellBook {
    spells: Spell[];

    constructor() {
        this.spells = [];
    }

    addSpell(name: string, level: number) {
        for (const spell of this.spells) {
            if (spell.name === name) {
                spell.level += level;
                //logger.info("Learned %s at level %d", spell_name, spell.level)
                return ["change", spell];
            }
        }
        const spell = new Spell(name, level);
        this.spells.push(spell);
        //logger.info("Learned %s at level %d", spell_name, spell.level)
        return ["add", spell];
    }

    bestSpell() {
        if (this.spells.length === 0) {
            return null;
        } else {
            return this.spells.reduce((best, spell) => {
                if (spell.level > best.level) {
                    return spell;
                } else {
                    return best;
                }
            });
        }   
    }

    get hasSpells(): boolean {
        return this.spells.length > 0;
    }

    get spellCount(): number {
        return this.spells.length;
    }
}