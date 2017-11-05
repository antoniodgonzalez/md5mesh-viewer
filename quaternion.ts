import { quat } from "gl-matrix";
import { Vector } from "./vector";

export type Quaternion = ReadonlyArray<number>;

const toQuat = (q: Quaternion): quat => quat.fromValues(q[0], q[1], q[2], q[3]);
const toQuaternion = (q: quat): Quaternion => [q[0], q[1], q[2], q[3]];
const conjugate = (q: Quaternion): Quaternion => toQuaternion(quat.conjugate(quat.create(), toQuat(q)));

export const createUnitQuaternion = (x: number, y: number, z: number): Quaternion => {
    const t = 1.0 - x * x - y * y - z * z;
    const w = t < 0.0 ? 0.0 : -Math.sqrt (t);
    return [ x, y, z, w ];
};

const toVector = (q: Quaternion): Vector => q.slice(0, 3);

export const rotate = (q: Quaternion, pos: Vector): Vector =>
    toVector(mul(mul(q, [...pos, 0]), normalize(conjugate(q))));

export const mul = (a: Quaternion, b: Quaternion): Quaternion =>
    toQuaternion(quat.mul(quat.create(), toQuat(a), toQuat(b)));

export const normalize = (q: Quaternion): Quaternion =>
    toQuaternion(quat.normalize(quat.create(), toQuat(q)));
