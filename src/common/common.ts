export function randomInt(max: number, min: number = 0): number {
    const int = Math.floor(Math.random() * max);
    return int < min ? min : int;
}

// Integer in the range [0, num).
export function below(num: number): number {
    return Math.floor(Math.random() * num);
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