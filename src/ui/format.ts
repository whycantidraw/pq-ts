import { Bar } from "../mechanics/bars";

// Render a bar as a fixed-width ASCII gauge, e.g. "[####------]  40%".
export function renderBar(bar: Bar, width: number = 20): string {
    const ratio = bar.max > 0 ? Math.min(1, bar.position / bar.max) : 0;
    const filled = Math.round(ratio * width);
    const empty = width - filled;
    const pct = Math.floor(ratio * 100);
    return `[${"#".repeat(filled)}${"-".repeat(empty)}] ${String(pct).padStart(3)}%`;
}

export function formatTimespan(ms: number): string {
    let num = ms / 1000;
    if (num < 60) {
        return `~${Math.floor(num)}s`;
    }
    num /= 60;
    if (num < 60) {
        return `~${Math.floor(num)}m`;
    }
    num /= 60;
    if (num < 24) {
        return `~${num.toFixed(1)}h`;
    }
    num /= 24;
    return `~${num.toFixed(1)}d`;
}
