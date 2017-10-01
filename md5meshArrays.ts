import { MD5Mesh, Joint, Triangle, Vertex } from "./md5mesh";
import * as R from "ramda";
import { add, div, normalize } from "./vector";

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

export function getMeshTrianglesPositions(model: MD5Mesh, index: number = 0): number[] {
    const { triangles, vertices } = model.meshes[index];
    return R.flatten<number>(triangles.map(t => [
        ...vertices[t.v1].position,
        ...vertices[t.v2].position,
        ...vertices[t.v3].position
    ]));
}

export function getMeshTrianglesNormals(model: MD5Mesh, index: number = 0): number[] {
    const { triangles } = model.meshes[index];
    return R.flatten<number>(triangles.map(t => [
        ...t.normal,
        ...t.normal,
        ...t.normal
    ]));
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
        return [ ...position, ...add(position, triangle.normal) ];
    };

    return R.flatten<number>(triangles.map(getPositionAndNormal));
}

function getVertexNormal(vertex: Vertex, triangles: Triangle[]): number[] {
    const vertexIsIncluded = (t: Triangle) =>  [ t.v1, t.v2, t.v3 ].includes(vertex.index);
    const normalsSum = triangles
        .filter(vertexIsIncluded)
        .map(t => t.normal)
        .reduce(add);
    return normalize(normalsSum);
}

export function getMeshVertexNormals(model: MD5Mesh, index: number): number[] {
    const { vertices, triangles } = model.meshes[index];

    const getPositionAndNormal = (vertex: Vertex) => {
        const normal = getVertexNormal(vertex, triangles);
        return [ ...vertex.position, ...add(vertex.position, normal) ];
    };

    return R.flatten<number>(vertices.map(getPositionAndNormal));
}
