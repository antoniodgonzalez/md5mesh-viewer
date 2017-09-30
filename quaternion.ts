import { quat, vec3 } from "gl-matrix";

export function createUnitQuaternion(x: number, y: number, z: number): quat {
    const t = 1.0 - x * x - y * y - z * z;
    const w = t < 0.0 ? 0.0 : -Math.sqrt (t);
    return quat.fromValues(x, y, z, w);
}

export function rotate(q: quat, p: vec3): vec3 {
    const qp = quat.fromValues(p[0], p[1], p[2], 0);

    const x = quat.multiply(quat.create(), q, qp);

    const qc = quat.conjugate(quat.create(), q);
    const qcn = quat.normalize(quat.create(), qc);
    const res = quat.multiply(quat.create(), x, qcn);
    return vec3.fromValues(res[0], res[1], res[2]);
}
