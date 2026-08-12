import { Box, Text, render, useApp } from "ink";
import { useState } from "react";
import { Player } from "../mechanics/player";
import { Roster } from "../persistence/roster";
import { CreateCharacter } from "./create";
import { Game } from "./game";
import { SelectList } from "./widgets";

const LOGO = ` ____                                     ___                  _
|  _ \\ _ __ ___   __ _ _ __ ___  ___ ___ / _ \\ _   _  ___  ___| |_
| |_) | '__/ _ \\ / _\` | '__/ _ \\/ __/ __| | | | | | |/ _ \\/ __| __|
|  __/| | | (_) | (_| | | |  __/\\__ \\__ \\ |_| | |_| |  __/\\__ \\ |_
|_|   |_|  \\___/ \\__, |_|  \\___||___/___/\\__\\_\\\\__,_|\\___||___/\\__|
                 |___/`;

type Screen = "menu" | "create" | "game";

type MenuChoice =
    | { kind: "play"; player: Player }
    | { kind: "create" }
    | { kind: "quit" };

function App({
    roster,
    initialPlayer,
    useSaves,
}: {
    roster: Roster;
    initialPlayer: Player | null;
    useSaves: boolean;
}) {
    const { exit } = useApp();
    const [screen, setScreen] = useState<Screen>(initialPlayer ? "game" : "menu");
    const [player, setPlayer] = useState<Player | null>(initialPlayer);

    if (screen === "menu") {
        const items = [
            ...roster.players.map((p) => ({
                label: `Play as ${p.name} (level ${p.level})`,
                value: { kind: "play", player: p } as MenuChoice,
            })),
            { label: "Create a new character", value: { kind: "create" } as MenuChoice },
            { label: "Quit", value: { kind: "quit" } as MenuChoice },
        ];
        return (
            <Box flexDirection="column">
                <Text color="yellow">{LOGO}</Text>
                <Box marginTop={1}>
                    <SelectList
                        title="Main menu (arrows + enter, or number keys):"
                        items={items}
                        onSelect={(choice) => {
                            if (choice.kind === "play") {
                                setPlayer(choice.player);
                                setScreen("game");
                            } else if (choice.kind === "create") {
                                setScreen("create");
                            } else {
                                exit();
                            }
                        }}
                    />
                </Box>
            </Box>
        );
    }

    if (screen === "create") {
        return (
            <CreateCharacter
                onCreate={(created) => {
                    roster.players.push(created);
                    if (useSaves) {
                        roster.save();
                    }
                    setPlayer(created);
                    setScreen("game");
                }}
                onCancel={() => setScreen("menu")}
            />
        );
    }

    return <Game player={player!} roster={roster} useSaves={useSaves} onQuit={() => exit()} />;
}

export async function runCurses(
    roster: Roster,
    initialPlayer: Player | null,
    useSaves: boolean,
): Promise<void> {
    const app = render(<App roster={roster} initialPlayer={initialPlayer} useSaves={useSaves} />);
    await app.waitUntilExit();
}
