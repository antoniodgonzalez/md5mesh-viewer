import { quat } from "gl-matrix";
import { Vector } from "./vector";

export type Quaternion = ReadonlyArray<number>;

const conjugate = (q: Quaternion): Quaternion => quat.conjugate(quat.create(), q);

export const createUnitQuaternion = (x: number, y: number, z: number): Quaternion => {
    const t = 1.0 - x * x - y * y - z * z;
    const w = t < 0.0 ? 0.0 : -Math.sqrt (t);
    return [ x, y, z, w ];
};

const toVector = (q: Quaternion): Vector => [q[0], q[1], q[2]];

export const rotate = (q: Quaternion, pos: Vector): Vector =>
    toVector(mul(mul(q, [...pos, 0]), normalize(conjugate(q))));

export const mul = (a: Quaternion, b: Quaternion): Quaternion =>
    quat.mul(quat.create(), a, b);

export const normalize = (q: Quaternion): Quaternion =>
    quat.normalize(quat.create(), q);

export const slerp = (a: Quaternion, b: Quaternion, t: number) =>
    quat.slerp(quat.create(), a, b, t);
