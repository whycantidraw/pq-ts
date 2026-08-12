import { choice } from "./common";

// Generate a pronounceable fantasy name by alternating consonant / vowel /
// consonant fragments.
export function generateName(): string {
    const parts = [
        "br|cr|dr|fr|gr|j|kr|l|m|n|pr||||r|sh|tr|v|wh|x|y|z".split("|"),
        "a|a|e|e|i|i|o|o|u|u|ae|ie|oo|ou".split("|"),
        "b|ck|d|g|k|m|n|p|t|v|x|z".split("|"),
    ];
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += choice(parts[i % 3]!);
    }
    return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
}

export function toRoman(num: number): string {
    if (!num) {
        return "N";
    }

    let ret = "";
    if (num < 0) {
        ret = "-";
        num = -num;
    }

    const rome = (dn: number, ds: string): boolean => {
        if (num >= dn) {
            num -= dn;
            ret += ds;
            return true;
        }
        return false;
    };

    while (rome(1000, "M"));
    rome(900, "CM");
    rome(500, "D");
    rome(400, "CD");
    while (rome(100, "C"));
    rome(90, "XC");
    rome(50, "L");
    rome(40, "XL");
    while (rome(10, "X"));
    rome(9, "IX");
    rome(5, "V");
    rome(4, "IV");
    while (rome(1, "I"));
    return ret;
}

export function actName(act: number): string {
    if (act === 0) {
        return "Prologue";
    }
    return `Act ${toRoman(act)}`;
}

export function plural(subject: string): string {
    if (subject.endsWith("y")) {
        return subject.slice(0, -1) + "ies";
    }
    if (subject.endsWith("us")) {
        return subject.slice(0, -2) + "i";
    }
    if (["ch", "x", "s", "sh"].some((s) => subject.endsWith(s))) {
        return subject + "es";
    }
    if (subject.endsWith("f")) {
        return subject.slice(0, -1) + "ves";
    }
    if (subject.endsWith("man") || subject.endsWith("Man")) {
        return subject.slice(0, -2) + "en";
    }
    return subject + "s";
}

export function indefinite(subject: string, qty: number): string {
    if (qty === 1) {
        if ("AEIOUaeiou?".includes(subject.charAt(0))) {
            return "an " + subject;
        }
        return "a " + subject;
    }
    return qty + " " + plural(subject);
}

export function definite(subject: string, qty: number): string {
    if (qty > 1) {
        subject = plural(subject);
    }
    return "the " + subject;
}

function prefix(list: string[], m: number, subject: string, sep: string = " "): string {
    m = Math.abs(m);
    if (m < 1 || m > list.length) {
        return subject;
    }
    return list[m - 1] + sep + subject;
}

export function sick(m: number, subject: string): string {
    m = 6 - Math.abs(m);
    return prefix(["dead", "comatose", "crippled", "sick", "undernourished"], m, subject);
}

export function young(m: number, subject: string): string {
    m = 6 - Math.abs(m);
    return prefix(["foetal", "baby", "preadolescent", "teenage", "underage"], m, subject);
}

export function big(m: number, subject: string): string {
    return prefix(["greater", "massive", "enormous", "giant", "titanic"], m, subject);
}

export function special(m: number, subject: string): string {
    if (subject.includes(" ")) {
        return prefix(["veteran", "cursed", "warrior", "undead", "demon"], m, subject);
    }
    return prefix(["Battle-", "cursed ", "Were-", "undead ", "demon "], m, subject, "");
}
