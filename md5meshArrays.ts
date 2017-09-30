import { MD5Mesh, Joint, Triangle } from "./md5mesh";
import * as R from "ramda";
import { add, div, sub, normalize, cross } from "./vector";

export function getJointsVertices(model: MD5Mesh): number[] {
    const {joints} = model;
    const hasParent = (j: Joint) => j.parent !== -1;
    const getJointVertices = (j: Joint) => [...joints[j.parent].position, ...j.position];
    return R.flatten<number>(joints.filter(hasParent).map(getJointVertices));
}

export function getMeshVertices(model: MD5Mesh, index: number = 0): number[] {
    const { vertices } = model.meshes[index];
    return R.flatten<number>(vertices.map(v => v.position));
}

export function getMeshTexCoords(model: MD5Mesh, index: number = 0): number[] {
    const { vertices } = model.meshes[index];
    return R.flatten<number>(vertices.map(v => [v.u, v.v]));
}

export function getMeshTriangles(model: MD5Mesh, index: number = 0): number[] {
    const { triangles } = model.meshes[index];
    return R.flatten<number>(triangles.map(t => [t.v1, t.v2, t.v3]));
}

export function getMeshTriangleNormals(model: MD5Mesh, index: number): number[] {
    const sum = (values: number[][]) => values.reduce(add);
    const midPosition = (values: number[][]) => div(sum(values), values.length);

    const { triangles, vertices } = model.meshes[index];

    const getPositionAndNormal = (triangle: Triangle) => {
        const p = [
            vertices[triangle.v1].position,
            vertices[triangle.v2].position,
            vertices[triangle.v3].position
        ];

        const position = midPosition(p);

        const vecA = sub(p[2], p[0]);
        const vecB = sub(p[1], p[0]);
        const normal = normalize(cross(vecA, vecB));

        return [ ...position, ...add(position, normal) ];
    };

    return R.flatten<number>(triangles.map(getPositionAndNormal));
}
