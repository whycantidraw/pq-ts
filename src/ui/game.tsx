import { Box, Text, measureElement, useApp, useInput, useWindowSize } from "ink";
import type { DOMElement } from "ink";
import { useEffect, useRef, useState } from "react";
import { logger } from "../common/logger";
import { toRoman } from "../common/lingo";
import { allStats, StatType } from "../data/enums";
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

// Log messages kept in component state; only the last 10 are displayed.
const LOG_STATE_MAX = 30;

// Frames rendered within a couple of rows of the viewport stay clear of
// Ink's full-screen-erase path; the pad also absorbs an occasional wrapped
// line (long item names) that would otherwise trip it.
const SAFETY_ROWS = 2;

// Fixed panel widths for the top three-column row; the plot/quest row, task
// panel and adventure log match their total so every section aligns.
const SHEET_WIDTH = 34;
const PANEL_WIDTH = 40;
const CONTENT_WIDTH = SHEET_WIDTH + PANEL_WIDTH * 2;

interface Trimmed<T> {
    lines: T[];
    hidden: number;
}

// Keep the last `budget` lines, reserving one slot for a "...and N more"
// indicator when anything had to be dropped. A budget of zero renders nothing.
function trimFromEnd<T>(items: T[], budget: number): Trimmed<T> {
    if (budget <= 0) {
        return { lines: [], hidden: 0 };
    }
    if (items.length <= budget) {
        return { lines: items, hidden: 0 };
    }
    const visible = budget - 1;
    return { lines: items.slice(items.length - visible), hidden: items.length - visible };
}

function Panel({ title, children, width }: { title: string; children: React.ReactNode; width?: number }) {
    return (
        <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1} width={width}>
            <Text bold color="cyan">{title}</Text>
            {children}
        </Box>
    );
}

function MoreIndicator({ hidden }: { hidden: number }) {
    if (hidden <= 0) {
        return null;
    }
    return <Text dimColor>...and {hidden} more</Text>;
}

export function Game({ player, roster, useSaves, onQuit }: GameProps) {
    const { exit } = useApp();
    const { rows, columns } = useWindowSize();
    const simRef = useRef<Simulation>(undefined);
    const lastTickRef = useRef<number>(Date.now());
    const rootRef = useRef<DOMElement>(null);
    // Extra rows to shave off the budget because the estimate ignored text
    // wrapping (narrow terminals shrink the fixed-width panels, so their
    // contents wrap onto extra lines).
    const trimCorrectionRef = useRef(0);
    const [, setFrame] = useState(0);
    const [log, setLog] = useState<string[]>(() => logger.messages.map((m) => m.message).slice(-LOG_STATE_MAX));

    if (!simRef.current) {
        simRef.current = new Simulation(player);
    }

    useEffect(() => {
        const unsubscribe = logger.subscribe((message) => {
            setLog((prev) => [...prev, message].slice(-LOG_STATE_MAX));
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

    // Ink erases and repaints the whole screen (visible flicker) whenever a
    // frame is at least as tall as the terminal viewport. Budget the layout
    // against the terminal height so frames always fit, keeping Ink on its
    // incremental line-diff path.
    const stats = player.stats.stats;
    const equipment = [...player.equipment.items.entries()];
    const spells = player.spellBook.spells;
    const items = player.inventory.items;
    const viewportRows = Math.max(rows || 24, 10);

    // Full-width sections align with the three-column row above; on narrower
    // terminals they fall back to the full terminal width.
    const contentWidth = Math.min(CONTENT_WIDTH, columns || CONTENT_WIDTH);

    // Self-correcting budget: measure the frame ink actually laid out and
    // adjust for whatever the estimate got wrong (e.g. wrapped lines).
    // Correction only ever grows (ratchet): relaxing would let the frame
    // height oscillate across the fit boundary and re-render forever.
    const atFloorRef = useRef(false);
    useEffect(() => {
        if (atFloorRef.current) {
            // The minimal layout already overflows; nothing left to trim, so
            // stop adjusting to avoid a render loop.
            return;
        }
        const height = rootRef.current ? measureElement(rootRef.current).height : 0;
        if (height <= 0) {
            return;
        }
        const residual = height + SAFETY_ROWS - viewportRows;
        if (residual <= 0) {
            return;
        }
        trimCorrectionRef.current += residual;
        setFrame((f) => f + 1);
    });

    // Rows actually available to fill: the raw budget minus any correction
    // learned from measuring real rendered frames.
    const effectiveRows = Math.max(6, viewportRows - trimCorrectionRef.current);

    // Compaction tiers latch on while the terminal keeps a given size; letting
    // them flip back and forth would bounce the frame height across Ink's
    // clear threshold and reintroduce flicker. Resizing starts fresh.
    const prevRowsRef = useRef<number | undefined>(undefined);
    const tiersRef = useRef({
        showHint: true,
        roomyMargins: true,
        twoColumnStats: false,
        compactStatus: false,
        bareLog: false,
        minimalMode: false,
    });
    if (prevRowsRef.current !== undefined && prevRowsRef.current !== rows) {
        tiersRef.current = {
            showHint: true,
            roomyMargins: true,
            twoColumnStats: false,
            compactStatus: false,
            bareLog: false,
            minimalMode: false,
        };
        trimCorrectionRef.current = 0;
    }
    prevRowsRef.current = rows;

    // Displayed-line budgets per flexible list. The log is capped at the
    // classic 10 lines; heights must respond monotonically to the budget so
    // the correction above can settle instead of oscillating.
    let logLines = Math.min(log.length, 10);
    let itemLines = Math.min(items.length, 8);
    let spellLines = Math.max(1, spells.length);
    let equipLines = Math.max(1, equipment.length);

    let { showHint, roomyMargins, twoColumnStats, compactStatus, bareLog, minimalMode } =
        tiersRef.current;

    // Estimated frame height. Must stay in sync with the JSX below.
    const MINIMAL_CHROME = 5;
    const frameHeight = (): number => {
        if (minimalMode) {
            return MINIMAL_CHROME + logLines;
        }
        // borders + title + identity lines + stat block (+ margins) + exp label/bar
        const sheet = 2 + 1 + 4 + (twoColumnStats ? 3 : 8) + (roomyMargins ? 2 : 0) + 2;
        // borders + title + gold + items (+ margin + encumbrance label/bar)
        const inventory = 2 + 1 + 1 + itemLines + (roomyMargins ? 3 : 2);
        const equipmentColumn = 3 + equipLines + (3 + spellLines);
        const topRow = Math.max(sheet, inventory, equipmentColumn);
        // The merged status panel replaces the plot/quest row and task panel
        // (10 rows), and the bare log drops its panel chrome (3 rows).
        const statusRows = compactStatus ? 8 : 10;
        const logRows = bareLog ? logLines : 3 + logLines;
        return topRow + statusRows + (showHint ? 1 : 0) + logRows;
    };

    // Shrink least-critical content first until the frame fits. Tier flips are
    // monotonic (they never revert until the terminal is resized).
    while (frameHeight() + SAFETY_ROWS > effectiveRows && !minimalMode) {
        if (spellLines > 1) {
            spellLines -= 1;
        } else if (itemLines > 0) {
            itemLines -= 1;
        } else if (logLines > 1) {
            logLines -= 1;
        } else if (showHint || roomyMargins) {
            showHint = false;
            roomyMargins = false;
        } else if (!twoColumnStats) {
            twoColumnStats = true;
        } else if (equipLines > 1) {
            equipLines -= 1;
        } else if (!compactStatus) {
            compactStatus = true;
        } else if (!bareLog) {
            bareLog = true;
        } else {
            minimalMode = true;
        }
    }

    if (minimalMode) {
        // Emergency layout: quest/task feed only, sized to fit any terminal.
        logLines = Math.max(1, Math.min(log.length, 10, effectiveRows - SAFETY_ROWS - MINIMAL_CHROME));
    }
    atFloorRef.current = minimalMode && frameHeight() + SAFETY_ROWS > effectiveRows;
    tiersRef.current = { showHint, roomyMargins, twoColumnStats, compactStatus, bareLog, minimalMode };

    const visibleLog = log.slice(-Math.max(1, logLines));
    const visibleSpells = trimFromEnd(spells, spellLines);
    const visibleItems = trimFromEnd(items, itemLines);
    const visibleEquipment = trimFromEnd(equipment, equipLines);

    const primeStats = allStats.slice(0, 6);
    const secondaryStats = allStats.slice(6);

    // Compact single-line stat rows for short terminals; must stay within the
    // character sheet's 30 usable columns so nothing wraps.
    const compactStat = (stat: StatType): string => `${stat} ${stats.get(stat) ?? 0}`;
    const compactStatRows = [
        primeStats.slice(0, 3).map(compactStat).join("   "),
        primeStats.slice(3).map(compactStat).join("   "),
        secondaryStats.map(compactStat).join("   "),
    ];

    if (minimalMode) {
        return (
            <Box ref={rootRef} flexDirection="column">
                <Text bold>{player.name} <Text dimColor>· Level {player.level}</Text></Text>
                <Text>{player.questBook.currentQuest ?? "Loading..."}</Text>
                <Text color="blue">{renderBar(player.questBook.questBar)}</Text>
                <Text>{player.task?.description ?? "..."}</Text>
                <Text color="green">{renderBar(player.taskBar, 60)}</Text>
                {visibleLog.map((message) => (
                    <Text key={message} dimColor>{message}</Text>
                ))}
            </Box>
        );
    }

    return (
        <Box ref={rootRef} flexDirection="column">
            <Box flexDirection="row">
                <Panel title="Character Sheet" width={SHEET_WIDTH}>
                    <Text>Name:  {player.name}</Text>
                    <Text>Race:  {player.species}</Text>
                    <Text>Class: {player.class}</Text>
                    <Text>Level: {player.level}</Text>
                    {twoColumnStats ? (
                        <Box marginTop={roomyMargins ? 1 : 0} flexDirection="column">
                            {compactStatRows.map((row) => (
                                <Text key={row}>{row}</Text>
                            ))}
                        </Box>
                    ) : (
                        <Box marginTop={1} flexDirection="column">
                            {allStats.map((stat) => (
                                <Text key={stat}>{stat.padEnd(7)} {stats.get(stat) ?? 0}</Text>
                            ))}
                        </Box>
                    )}
                    <Box marginTop={roomyMargins ? 1 : 0} flexDirection="column">
                        <Text>Experience</Text>
                        <Text color="green">{renderBar(player.expBar)}</Text>
                    </Box>
                </Panel>

                <Box flexDirection="column">
                    <Panel title="Equipment" width={PANEL_WIDTH}>
                        {equipment.length === 0 ? (
                            <Text dimColor>Nothing equipped.</Text>
                        ) : (
                            <>
                                {visibleEquipment.lines.map(([slot, name]) => (
                                    <Text key={slot}>{slot.padEnd(11)} {name}</Text>
                                ))}
                                <MoreIndicator hidden={visibleEquipment.hidden} />
                            </>
                        )}
                    </Panel>
                    <Panel title="Spell Book" width={PANEL_WIDTH}>
                        {spells.length === 0 ? (
                            <Text dimColor>No spells learned yet.</Text>
                        ) : (
                            <>
                                {visibleSpells.lines.map((spell) => (
                                    <Text key={spell.name}>{spell.name} {toRoman(spell.level)}</Text>
                                ))}
                                <MoreIndicator hidden={visibleSpells.hidden} />
                            </>
                        )}
                    </Panel>
                </Box>

                <Panel title="Inventory" width={PANEL_WIDTH}>
                    <Text>Gold: {player.inventory.gold}</Text>
                    <Box flexDirection="column">
                        {visibleItems.lines.map((item) => (
                            <Text key={item.name}>{item.quantity}x {item.name}</Text>
                        ))}
                        <MoreIndicator hidden={visibleItems.hidden} />
                    </Box>
                    <Box marginTop={roomyMargins ? 1 : 0} flexDirection="column">
                        <Text>Encumbrance</Text>
                        <Text color="yellow">{renderBar(player.inventory.encumbranceBar)}</Text>
                    </Box>
                </Panel>
            </Box>

            {compactStatus ? (
                <Panel title="Status" width={contentWidth}>
                    <Text>Act {toRoman(player.questBook.act)}</Text>
                    <Text color="blue">{player.questBook.currentQuest ?? "Loading..."}</Text>
                    <Text color="magenta">{renderBar(player.questBook.questBar)}</Text>
                    <Text>{player.task?.description ?? "..."}</Text>
                    <Text color="green">{renderBar(player.taskBar, 60)}</Text>
                </Panel>
            ) : (
                <>
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

                    <Panel title="Current Task" width={contentWidth}>
                        <Text>{player.task?.description ?? "..."}</Text>
                        <Text color="green">{renderBar(player.taskBar, 60)}</Text>
                    </Panel>
                </>
            )}

            {bareLog ? (
                <Box flexDirection="column" width={contentWidth}>
                    {visibleLog.map((message, i) => (
                        <Text key={`${visibleLog.length - i}-${message}`} dimColor={i < visibleLog.length - 1}>{message}</Text>
                    ))}
                </Box>
            ) : (
                <Panel title="Adventure Log" width={contentWidth}>
                    {visibleLog.map((message, i) => (
                        <Text key={`${visibleLog.length - i}-${message}`} dimColor={i < visibleLog.length - 1}>{message}</Text>
                    ))}
                </Panel>
            )}

            {showHint ? <Text dimColor>Press q to save and quit.</Text> : null}
        </Box>
    );
}
