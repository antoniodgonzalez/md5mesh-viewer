import { vec3 } from "gl-matrix";

export const add = (a: number[], b: number[]): number[] => [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];

export const sub = (a: number[], b: number[]): number[] => a.map((_, i) => a[i] - b[i]);

export const mul = (a: number[], b: number): number[] => [ a[0] * b, a[1] * b, a[2] * b ];

export const div = (a: number[], b: number): number[] => [ a[0] / b, a[1] / b, a[2] / b ];

export const cross = (a: number[], b: number[]): number[] => {
    const c = vec3.cross(vec3.create(), a, b);
    return [c[0], c[1], c[2]];
};

export const normalize = (a: number[]): number[] => {
    const c = vec3.normalize(vec3.create(), a);
    return [c[0], c[1], c[2]];
};
