// A tiny in-process logger: mechanics emit human-readable game events through
// it, and the UIs subscribe to render them as a scrolling feed.
type LogListener = (message: string) => void;

export interface LogEntry {
    time: Date;
    message: string;
}

class Logger {
    private listeners = new Set<LogListener>();
    private buffer: LogEntry[] = [];
    maxBuffer = 1000;

    info(message: string): void {
        this.buffer.push({ time: new Date(), message });
        if (this.buffer.length > this.maxBuffer) {
            this.buffer.shift();
        }
        for (const listener of this.listeners) {
            listener(message);
        }
    }

    subscribe(listener: LogListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    get messages(): readonly LogEntry[] {
        return this.buffer;
    }

    clear(): void {
        this.buffer = [];
    }
}

export const logger = new Logger();
