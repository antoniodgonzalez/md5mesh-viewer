import { quat } from "gl-matrix";

export function createUnitQuaternion(x: number, y: number, z: number): quat {
    const t = 1.0 - x * x - y * y - z * z;
    const w = t < 0.0 ? 0.0 : -Math.sqrt (t);
    return quat.fromValues(x, y, z, w);
}

export function rotate(q: quat, pos: number[]): number[] {
    const qp = quat.fromValues(pos[0], pos[1], pos[2], 0);

    const x = quat.multiply(quat.create(), q, qp);

    const qc = quat.conjugate(quat.create(), q);
    const qcn = quat.normalize(quat.create(), qc);
    const res = quat.multiply(quat.create(), x, qcn);
    return [ res[0], res[1], res[2] ];
}

export const mul = (a: quat, b: quat): quat => quat.mul(quat.create(), a, b);

export const normalize = (q: quat): quat => quat.normalize(quat.create(), q);
