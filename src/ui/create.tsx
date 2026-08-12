import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { classes } from "../data/classes";
import { allStats, StatType } from "../data/enums";
import { species } from "../data/species";
import { Player } from "../mechanics/player";
import { StatsBuilder, createPlayer, statTotal } from "../mechanics/stats-builder";
import { SelectList } from "./widgets";
import { TextPrompt } from "./widgets";

type Step = "name" | "race" | "class" | "stats";

export function CreateCharacter({
    onCreate,
    onCancel,
}: {
    onCreate: (player: Player) => void;
    onCancel: () => void;
}) {
    const [step, setStep] = useState<Step>("name");
    const [name, setName] = useState("");
    const [race, setRace] = useState("");
    const [playerClass, setPlayerClass] = useState("");
    const [builder] = useState(() => new StatsBuilder());
    const [stats, setStats] = useState<Map<StatType, number>>(() => builder.roll());

    useInput(
        (input, key) => {
            if (step !== "stats") {
                return;
            }
            if (input === " " || input === "r") {
                setStats(builder.roll());
            } else if (input === "u") {
                setStats(builder.unroll());
            } else if (key.return) {
                const player = createPlayer(name, race, playerClass, stats);
                onCreate(player);
            } else if (key.escape) {
                onCancel();
            }
        },
        { isActive: step === "stats" },
    );

    if (step === "name") {
        return (
            <TextPrompt
                prompt="Name your new character: "
                onSubmit={(value) => {
                    if (value.trim()) {
                        setName(value.trim());
                        setStep("race");
                    } else {
                        onCancel();
                    }
                }}
                onCancel={onCancel}
            />
        );
    }

    if (step === "race") {
        return (
            <SelectList
                title="Choose a race:"
                items={species.map((s) => ({ label: s.name, value: s.name }))}
                onSelect={(value) => {
                    setRace(value);
                    setStep("class");
                }}
            />
        );
    }

    if (step === "class") {
        return (
            <SelectList
                title="Choose a class:"
                items={classes.map((c) => ({ label: c.name, value: c.name }))}
                onSelect={(value) => {
                    setPlayerClass(value);
                    setStep("stats");
                }}
            />
        );
    }

    return (
        <Box flexDirection="column">
            <Text bold>
                Roll stats for {name} the {race} {playerClass}:
            </Text>
            <Box flexDirection="column" marginY={1}>
                {allStats.map((stat) => (
                    <Text key={stat}>
                        {stat.padEnd(8)} {stats.get(stat) ?? 0}
                    </Text>
                ))}
                <Text bold>Total (prime): {statTotal(stats)}</Text>
            </Box>
            <Text dimColor>[space] reroll  [u] undo roll  [enter] accept  [esc] cancel</Text>
        </Box>
    );
}
