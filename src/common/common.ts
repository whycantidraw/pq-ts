// A seedable pseudo-random generator (mulberry32) so runs can be made
// reproducible via seed(). Defaults to an entropic seed.
let _rngState = (Math.random() * 0x100000000) >>> 0;

function _next(): number {
    _rngState |= 0;
    _rngState = (_rngState + 0x6d2b79f5) | 0;
    let t = Math.imul(_rngState ^ (_rngState >>> 15), 1 | _rngState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
}

// Seed the generator from an arbitrary string (hashed to a 32-bit state).
export function seed(source: string): void {
    let h = 0x811c9dc5;
    for (let i = 0; i < source.length; i++) {
        h ^= source.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    _rngState = h >>> 0;
}

export function randomInt(max: number, min: number = 0): number {
    const int = Math.floor(_next() * max);
    return int < min ? min : int;
}

// Integer in the range [0, num).
export function below(num: number): number {
    return Math.floor(_next() * num);
}

// Like below(), but biased towards lower numbers.
export function belowLow(num: number): number {
    return Math.min(below(num), below(num));
}

// True with probability chance/outOf.
export function odds(chance: number, outOf: number): boolean {
    return below(outOf) < chance;
}

// A random element of source.
export function choice<T>(source: readonly T[]): T {
    return source[below(source.length)]!;
}

// A random element of source, biased towards earlier elements.
export function choiceLow<T>(source: readonly T[]): T {
    return source[belowLow(source.length)]!;
}