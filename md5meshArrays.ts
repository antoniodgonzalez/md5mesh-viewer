import {vec3, quat} from "gl-matrix";
import { MD5Mesh } from "./md5mesh";

export function getJointsVertices(model: MD5Mesh): number[] {
    const {joints} = model;
    const vertices = new Array((joints.length - 1) * 3 * 2);
    let i = 0;

    joints.filter(j => j.parent !== -1)
        .forEach(joint => {
            const parent = joints[joint.parent];
            vertices[i * 6 + 0] = parent.position[0];
            vertices[i * 6 + 1] = parent.position[1];
            vertices[i * 6 + 2] = parent.position[2];
            vertices[i * 6 + 3] = joint.position[0];
            vertices[i * 6 + 4] = joint.position[1];
            vertices[i * 6 + 5] = joint.position[2];
            i++;
        });

    return vertices;
}

function rotate(q: quat, p: vec3): quat {
    const qp = quat.fromValues(p[0], p[1], p[2], 0);

    const x = quat.multiply(quat.create(), q, qp);

    const qc = quat.conjugate(quat.create(), q);
    const qcn = quat.normalize(quat.create(), qc);
    return quat.multiply(quat.create(), x, qcn);
}

export function getMeshVertices(model: MD5Mesh, index: number = 0): number[] {
    const {joints} = model;
    const {vertices, weights} = model.meshes[index];
    const v = new Array(vertices.length * 3);

    for (let i = 0; i < vertices.length; i++) {
        const vertex = vertices[i];

        v[i * 3 + 0] = 0;
        v[i * 3 + 1] = 0;
        v[i * 3 + 2] = 0;
        for (let j = 0; j < vertex.countWeight; j++) {
            const weight = weights[vertex.startWeight + j];
            const joint = joints[weight.joint];

            const vw = rotate(joint.orientation, weight.position);

            v[i * 3 + 0] += (joint.position[0] + vw[0]) * weight.bias;
            v[i * 3 + 1] += (joint.position[1] + vw[1]) * weight.bias;
            v[i * 3 + 2] += (joint.position[2] + vw[2]) * weight.bias;
        }
    }

    return v;
}

export function getMeshTexCoords(model: MD5Mesh, index: number = 0): number[] {
    const {vertices} = model.meshes[index];
    const v = new Array(vertices.length * 2);

    for (let i = 0; i < vertices.length; i++) {
        const vertex = vertices[i];

        v[i * 2 + 0] = vertex.u;
        v[i * 2 + 1] = vertex.v;
    }

    return v;
}

export function getMeshTriangles(model: MD5Mesh, index: number = 0): number[] {
    const {triangles} = model.meshes[index];
    const v = new Array(triangles.length * 3);

    for (let i = 0; i < triangles.length; i++) {
        v[i * 3 + 0] = triangles[i].v1;
        v[i * 3 + 1] = triangles[i].v2;
        v[i * 3 + 2] = triangles[i].v3;
    }

    return v;
}
