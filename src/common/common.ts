export function randomInt(max: number, min: number = 0): number {
    const int = Math.floor(Math.random() * max);
    return int < min ? min : int;
}