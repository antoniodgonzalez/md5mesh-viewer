export type Vector = ReadonlyArray<number>;

export const add = (a: Vector, b: Vector): Vector => [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];

export const sub = (a: Vector, b: Vector): Vector => [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ];

export const mul = (a: Vector, b: number): Vector => [ a[0] * b, a[1] * b, a[2] * b ];

export const div = (a: Vector, b: number): Vector => [ a[0] / b, a[1] / b, a[2] / b ];

export const cross = (a: Vector, b: Vector): Vector => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
];

export const normalize = (a: Vector): Vector => {
    const s = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
    return s <= 0 ? a : div(a, Math.sqrt(s));
};

export const flatten = (vectors: ReadonlyArray<Vector>): ReadonlyArray<number> => {
    const a: number[] = [];
    for (const b of vectors) {
        a.push(...b);
    }
    return a;
};

export const sum = (vectors: ReadonlyArray<Vector>): Vector => {
    const a = [0, 0, 0];
    for (const b of vectors) {
        a[0] += b[0];
        a[1] += b[1];
        a[2] += b[2];
    }
    return a;
};
