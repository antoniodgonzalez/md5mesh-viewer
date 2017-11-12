export type Vector = ReadonlyArray<number>;

export const add = (a: Vector, b: Vector): Vector => a.map((_, i) => a[i] + b[i]);

export const sub = (a: Vector, b: Vector): Vector => a.map((_, i) => a[i] - b[i]);

export const mul = (a: Vector, b: number): Vector => a.map(x => x * b);

export const div = (a: Vector, b: number): Vector => a.map(x => x / b);

export const cross = (a: Vector, b: Vector): Vector => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
];

export const normalize = (a: Vector): Vector => {
    const sum = a.reduce((s, x) => s += x * x, 0);
    return sum <= 0 ? a : div(a, Math.sqrt(sum));
};

export const flatten = (array: ReadonlyArray<Vector>) =>
    array.reduce((a: ReadonlyArray<number>, b: Vector) => a.concat(b), []);
