import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { logger } from "../common/logger";
import { Player } from "../mechanics/player";
import type { PlayerJSON } from "./serialize";
import { playerFromJSON, playerToJSON } from "./serialize";

const SAVE_INTERVAL_MS = 300 * 1000;

// A collection of characters persisted to disk as JSON, with a rotated backup
// on every save (mirroring the original's .old / .new dance).
export class Roster {
    path: string;
    players: Player[];
    private lastSave: number;

    constructor(path: string, players: Player[]) {
        this.path = path;
        this.players = players;
        this.lastSave = Date.now();
    }

    static load(path: string): Roster {
        if (existsSync(path)) {
            try {
                const raw = readFileSync(path, "utf8");
                const data = JSON.parse(raw) as PlayerJSON[];
                return new Roster(path, data.map(playerFromJSON));
            } catch (err) {
                logger.info(`Failed to load roster: ${String(err)}`);
                return new Roster(path, []);
            }
        }
        return new Roster(path, []);
    }

    save(): void {
        this.lastSave = Date.now();
        const oldPath = this.path + ".old";
        const tmpPath = this.path + ".new";
        mkdirSync(dirname(this.path), { recursive: true });
        writeFileSync(tmpPath, JSON.stringify(this.players.map(playerToJSON)));
        if (existsSync(this.path)) {
            if (existsSync(oldPath)) {
                rmSync(oldPath);
            }
            renameSync(this.path, oldPath);
        }
        renameSync(tmpPath, this.path);
    }

    savePeriodically(): void {
        if (Date.now() - this.lastSave >= SAVE_INTERVAL_MS) {
            logger.info("Saving...");
            this.save();
        }
    }
}
