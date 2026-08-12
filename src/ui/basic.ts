import { stdin, stdout } from "node:process";
import * as readline from "node:readline/promises";
import { choice } from "../common/common";
import { logger } from "../common/logger";
import { toRoman } from "../common/lingo";
import { classes } from "../data/classes";
import { primeStats, StatType } from "../data/enums";
import { species } from "../data/species";
import { Player } from "../mechanics/player";
import { Simulation } from "../mechanics/simulation";
import { StatsBuilder, createPlayer, statTotal } from "../mechanics/stats-builder";
import { Roster } from "../persistence/roster";

const LOGO = `
 ____                                     ___                  _
|  _ \\ _ __ ___   __ _ _ __ ___  ___ ___ / _ \\ _   _  ___  ___| |_
| |_) | '__/ _ \\ / _\` | '__/ _ \\/ __/ __| | | | | | |/ _ \\/ __| __|
|  __/| | | (_) | (_| | | |  __/\\__ \\__ \\ |_| | |_| |  __/\\__ \\ |_
|_|   |_|  \\___/ \\__, |_|  \\___||___/___/\\__\\_\\\\__,_|\\___||___/\\__|
                 |___/
`;

type Rl = readline.Interface;

async function menu<T>(rl: Rl, options: { value: T; label: string }[], title?: string): Promise<T> {
    console.log();
    if (title) {
        console.log(`${title}:`);
    }
    options.forEach((o, i) => console.log(`${i + 1}) ${o.label}`));
    console.log();
    for (;;) {
        const n = Number(await rl.question("Your choice: "));
        if (Number.isInteger(n) && n >= 1 && n <= options.length) {
            return options[n - 1]!.value;
        }
        console.log(`Expected a number between 1..${options.length}`);
    }
}

async function confirm(rl: Rl, message: string): Promise<boolean> {
    for (;;) {
        const answer = (await rl.question(`${message} [y/n] `)).toLowerCase();
        if (["y", "yes", "1"].includes(answer)) {
            return true;
        }
        if (["n", "no", "0"].includes(answer)) {
            return false;
        }
    }
}

function printPlayerInfo(player: Player): void {
    console.log("--- Character Sheet ---");
    console.log(`Name: ${player.name}`);
    console.log(`Race: ${player.species}`);
    console.log(`Class: ${player.class}`);
    console.log(`Level: ${player.level}`);
    console.log();
    for (const [stat, value] of player.stats.stats) {
        console.log(`${stat}: ${value}`);
    }
    console.log();
    console.log("--- Spell Book ---");
    if (player.spellBook.spells.length === 0) {
        console.log("No spells memorized yet.");
    } else {
        for (const spell of player.spellBook.spells) {
            console.log(`${spell.name} ${toRoman(spell.level)}`);
        }
    }
    console.log();
    console.log("--- Equipment ---");
    for (const [slot, name] of player.equipment.items) {
        console.log(`${slot}: ${name}`);
    }
    console.log();
    console.log("--- Inventory ---");
    console.log(`Gold: ${player.inventory.gold}`);
    for (const item of player.inventory.items) {
        console.log(`${item.name}: ${item.quantity}`);
    }
    console.log();
    console.log("--- Plot ---");
    console.log(`Current act: ${toRoman(player.questBook.act)}`);
    console.log(`Current quest: ${player.questBook.currentQuest || "?"}`);
    console.log(`Current task: ${player.task ? player.task.description : "?"}`);
}

async function createPlayerFlow(roster: Roster, useSaves: boolean, rl: Rl): Promise<Player | null> {
    const name = (await rl.question("Name your new character: ")).trim();
    if (!name) {
        console.log("Cancelled.");
        return null;
    }
    const race = await menu(rl, species.map((s) => ({ value: s.name, label: s.name })), "Choose a race");
    const cls = await menu(rl, classes.map((c) => ({ value: c.name, label: c.name })), "Choose a class");

    const builder = new StatsBuilder();
    let stats: Map<StatType, number>;
    for (;;) {
        stats = builder.roll();
        for (const stat of primeStats) {
            console.log(`${stat}: ${stats.get(stat)}`);
        }
        console.log(`Total: ${statTotal(stats)}`);
        if (await confirm(rl, "Is this okay?")) {
            break;
        }
    }

    const player = createPlayer(name, race, cls, stats);
    roster.players.push(player);
    if (useSaves) {
        roster.save();
    }
    return player;
}

function play(player: Player, roster: Roster, useSaves: boolean): Promise<never> {
    console.log(`Playing as ${player.name}`);
    const simulation = new Simulation(player);
    logger.subscribe((message) => {
        console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
    });
    let lastTick = Date.now();
    setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastTick;
        lastTick = now;
        simulation.tick(elapsed);
        if (useSaves) {
            roster.savePeriodically();
        }
    }, 100);
    // Runs until interrupted (Ctrl-C); never resolves.
    return new Promise<never>(() => {});
}

async function choosePlayer(rl: Rl, roster: Roster): Promise<Player | null> {
    if (roster.players.length === 0) {
        console.log("No characters to choose from!");
        return null;
    }
    return menu(rl, roster.players.map((p) => ({ value: p, label: p.name })), "Choose your character");
}

export async function runBasic(
    roster: Roster,
    initialPlayer: Player | null,
    useSaves: boolean,
): Promise<void> {
    console.log(LOGO);

    if (initialPlayer) {
        await play(initialPlayer, roster, useSaves);
        return;
    }

    const rl = readline.createInterface({ input: stdin, output: stdout });
    try {
        for (;;) {
            const action = await menu(rl, [
                { value: "create", label: "Create a new character" },
                { value: "play", label: "Play as character" },
                { value: "info", label: "Query character info" },
                { value: "delete", label: "Delete a character" },
                { value: "quit", label: "Quit" },
            ] as const);

            if (action === "create") {
                await createPlayerFlow(roster, useSaves, rl);
            } else if (action === "play") {
                const player = await choosePlayer(rl, roster);
                if (player) {
                    rl.close();
                    await play(player, roster, useSaves);
                    return;
                }
            } else if (action === "info") {
                const player = await choosePlayer(rl, roster);
                if (player) {
                    printPlayerInfo(player);
                }
            } else if (action === "delete") {
                const player = await choosePlayer(rl, roster);
                if (player) {
                    const adjective = choice(["faithful", "noble", "loyal", "brave"]);
                    if (await confirm(rl, `Terminate ${adjective} ${player.name}?`)) {
                        roster.players.splice(roster.players.indexOf(player), 1);
                        if (useSaves) {
                            roster.save();
                        }
                    }
                }
            } else if (action === "quit") {
                if (useSaves) {
                    roster.save();
                }
                return;
            }
        }
    } finally {
        rl.close();
    }
}
