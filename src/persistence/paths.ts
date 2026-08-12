import { homedir } from "node:os";
import { join } from "node:path";

// Location of the roster save file, honoring $XDG_CONFIG_HOME like the original.
export function savePath(): string {
    const base = process.env["XDG_CONFIG_HOME"] || join(homedir(), ".config");
    return join(base, "pqcli", "save.dat");
}
