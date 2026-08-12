import { Box, Text, useInput } from "ink";
import { useState } from "react";

export interface SelectItem<T> {
    label: string;
    value: T;
}

export function SelectList<T>({
    items,
    onSelect,
    title,
}: {
    items: SelectItem<T>[];
    onSelect: (value: T) => void;
    title?: string;
}) {
    const [index, setIndex] = useState(0);

    useInput((input, key) => {
        if (key.upArrow || input === "k") {
            setIndex((i) => (i - 1 + items.length) % items.length);
        } else if (key.downArrow || input === "j") {
            setIndex((i) => (i + 1) % items.length);
        } else if (key.return) {
            onSelect(items[index]!.value);
        } else if (/^[1-9]$/.test(input)) {
            const n = Number(input) - 1;
            if (n < items.length) {
                onSelect(items[n]!.value);
            }
        }
    });

    return (
        <Box flexDirection="column">
            {title ? <Text bold>{title}</Text> : null}
            {items.map((item, i) => (
                <Text key={i} color={i === index ? "cyan" : undefined}>
                    {i === index ? "> " : "  "}
                    {item.label}
                </Text>
            ))}
        </Box>
    );
}

export function TextPrompt({
    prompt,
    onSubmit,
    onCancel,
}: {
    prompt: string;
    onSubmit: (value: string) => void;
    onCancel?: () => void;
}) {
    const [value, setValue] = useState("");

    useInput((input, key) => {
        if (key.return) {
            onSubmit(value);
        } else if (key.escape) {
            onCancel?.();
        } else if (key.backspace || key.delete) {
            setValue((v) => v.slice(0, -1));
        } else if (input && !key.ctrl && !key.meta) {
            setValue((v) => v + input);
        }
    });

    return (
        <Text>
            {prompt}
            {value}
            <Text inverse> </Text>
        </Text>
    );
}
