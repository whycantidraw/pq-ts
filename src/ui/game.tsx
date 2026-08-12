import { Box, Text, useApp, useInput } from "ink";
import { useEffect, useRef, useState } from "react";
import { logger } from "../common/logger";
import { toRoman } from "../common/lingo";
import { allStats } from "../data/enums";
import { Player } from "../mechanics/player";
import { Simulation } from "../mechanics/simulation";
import { Roster } from "../persistence/roster";
import { renderBar } from "./format";

interface GameProps {
    player: Player;
    roster: Roster;
    useSaves: boolean;
    onQuit: () => void;
}

function Panel({ title, children, width }: { title: string; children: React.ReactNode; width?: number }) {
    return (
        <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1} width={width}>
            <Text bold color="cyan">{title}</Text>
            {children}
        </Box>
    );
}

export function Game({ player, roster, useSaves, onQuit }: GameProps) {
    const { exit } = useApp();
    const simRef = useRef<Simulation>(undefined);
    const lastTickRef = useRef<number>(Date.now());
    const [, setFrame] = useState(0);
    const [log, setLog] = useState<string[]>(() => logger.messages.map((m) => m.message).slice(-10));

    if (!simRef.current) {
        simRef.current = new Simulation(player);
    }

    useEffect(() => {
        const unsubscribe = logger.subscribe((message) => {
            setLog((prev) => [...prev, message].slice(-10));
        });

        const timer = setInterval(() => {
            const now = Date.now();
            const elapsed = now - lastTickRef.current;
            lastTickRef.current = now;
            simRef.current!.tick(elapsed);
            if (useSaves) {
                roster.savePeriodically();
            }
            setFrame((f) => f + 1);
        }, 100);

        return () => {
            clearInterval(timer);
            unsubscribe();
        };
    }, [roster, useSaves]);

    useInput((input) => {
        if (input === "q") {
            exit();
            onQuit();
        }
    });

    const stats = player.stats.stats;
    const equipment = [...player.equipment.items.entries()];

    return (
        <Box flexDirection="column">
            <Box flexDirection="row">
                <Panel title="Character Sheet" width={34}>
                    <Text>Name:  {player.name}</Text>
                    <Text>Race:  {player.species}</Text>
                    <Text>Class: {player.class}</Text>
                    <Text>Level: {player.level}</Text>
                    <Box marginTop={1} flexDirection="column">
                        {allStats.map((stat) => (
                            <Text key={stat}>{stat.padEnd(7)} {stats.get(stat) ?? 0}</Text>
                        ))}
                    </Box>
                    <Box marginTop={1} flexDirection="column">
                        <Text>Experience</Text>
                        <Text color="green">{renderBar(player.expBar)}</Text>
                    </Box>
                </Panel>

                <Box flexDirection="column">
                    <Panel title="Equipment" width={40}>
                        {equipment.length === 0 ? (
                            <Text dimColor>Nothing equipped.</Text>
                        ) : (
                            equipment.map(([slot, name]) => (
                                <Text key={slot}>{slot.padEnd(11)} {name}</Text>
                            ))
                        )}
                    </Panel>
                    <Panel title="Spell Book" width={40}>
                        {player.spellBook.spells.length === 0 ? (
                            <Text dimColor>No spells learned yet.</Text>
                        ) : (
                            player.spellBook.spells.map((spell) => (
                                <Text key={spell.name}>{spell.name} {toRoman(spell.level)}</Text>
                            ))
                        )}
                    </Panel>
                </Box>

                <Panel title="Inventory" width={40}>
                    <Text>Gold: {player.inventory.gold}</Text>
                    <Box flexDirection="column">
                        {player.inventory.items.slice(-8).map((item) => (
                            <Text key={item.name}>{item.quantity}x {item.name}</Text>
                        ))}
                    </Box>
                    <Box marginTop={1} flexDirection="column">
                        <Text>Encumbrance</Text>
                        <Text color="yellow">{renderBar(player.inventory.encumbranceBar)}</Text>
                    </Box>
                </Panel>
            </Box>

            <Box flexDirection="row">
                <Panel title="Plot" width={37}>
                    <Text>Act {toRoman(player.questBook.act)}</Text>
                    <Text color="magenta">{renderBar(player.questBook.plotBar)}</Text>
                </Panel>
                <Panel title="Quest" width={77}>
                    <Text>{player.questBook.currentQuest ?? "Loading..."}</Text>
                    <Text color="blue">{renderBar(player.questBook.questBar)}</Text>
                </Panel>
            </Box>

            <Panel title="Adventure Log">
                {log.map((message, i) => (
                    <Text key={i} dimColor={i < log.length - 1}>{message}</Text>
                ))}
            </Panel>

            <Panel title="Current Task">
                <Text>{player.task?.description ?? "..."}</Text>
                <Text color="green">{renderBar(player.taskBar, 60)}</Text>
            </Panel>

            <Text dimColor>Press q to save and quit.</Text>
        </Box>
    );
}
