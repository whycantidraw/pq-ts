#!/usr/bin/env bun
import { Player } from "./mechanics/player";
import { savePath } from "./persistence/paths";
import { Roster } from "./persistence/roster";
import { runBasic } from "./ui/basic";
import { runCurses } from "./ui/curses";

interface Options {
    ui: "basic" | "curses";
    useSaves: boolean;
    listSaves: boolean;
    loadSave: number | null;
}

const HELP = `pqcli - Progress Quest in your terminal

Usage: pqcli [options]

Options:
  --curses       Rich terminal interface (default)
  --basic        Minimal interface, least CPU (good for servers)
  --no-save      Do not read or write the save file
  --list-saves   List saved characters and exit
  --load-save N  Play the Nth saved character directly
  -h, --help     Show this help and exit`;

function parseArgs(argv: string[]): Options {
    const opts: Options = { ui: "curses", useSaves: true, listSaves: false, loadSave: null };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--basic") {
            opts.ui = "basic";
        } else if (arg === "--curses") {
            opts.ui = "curses";
        } else if (arg === "--no-save") {
            opts.useSaves = false;
        } else if (arg === "--list-saves") {
            opts.listSaves = true;
        } else if (arg === "--load-save") {
            opts.loadSave = Number(argv[++i]);
        } else if (arg?.startsWith("--load-save=")) {
            opts.loadSave = Number(arg.slice("--load-save=".length));
        } else if (arg === "--help" || arg === "-h") {
            console.log(HELP);
            process.exit(0);
        } else {
            console.error(`Unknown argument: ${arg}`);
            console.error(HELP);
            process.exit(1);
        }
    }
    return opts;
}

function listPlayers(roster: Roster, error = false): void {
    const out = error ? console.error : console.log;
    roster.players.forEach((player, i) => out(`${i + 1}. ${player.name}`));
}

async function main(): Promise<void> {
    const opts = parseArgs(process.argv.slice(2));
    const roster = Roster.load(savePath());

    if (opts.listSaves) {
        listPlayers(roster);
        return;
    }

    let player: Player | null = null;
    if (opts.loadSave !== null) {
        player = roster.players[opts.loadSave - 1] ?? null;
        if (!player) {
            console.error("Invalid player. Available players:");
            listPlayers(roster, true);
            process.exit(1);
        }
    }

    process.on("SIGINT", () => {
        if (opts.useSaves) {
            roster.save();
        }
        process.exit(0);
    });

    try {
        if (opts.ui === "basic") {
            await runBasic(roster, player, opts.useSaves);
        } else {
            await runCurses(roster, player, opts.useSaves);
        }
    } finally {
        if (opts.useSaves) {
            roster.save();
        }
    }
}

main();
