import { MD5Mesh, Joint, Triangle, Vertex } from "./md5mesh";
import * as R from "ramda";
import { add, div, normalize } from "./vector";

export function getJointsVertices(model: MD5Mesh): number[] {
    const { joints } = model;
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
    return R.flatten<number>(vertices.map(v => v.uv));
}

export function getMeshTriangles(model: MD5Mesh, index: number = 0): number[] {
    const { triangles } = model.meshes[index];
    return R.flatten<number>(triangles.map(t => t.indices));
}

export function getMeshTrianglesPositions(model: MD5Mesh, index: number = 0): number[] {
    const { triangles, vertices } = model.meshes[index];
    const trianglePositions = ({indices}: Triangle) => R.flatten<number>(indices.map(i => vertices[i].position));
    return R.flatten<number>(triangles.map(trianglePositions));
}

export function getMeshTrianglesNormals(model: MD5Mesh, index: number = 0): number[] {
    const { triangles } = model.meshes[index];
    const triangleVertexNormals = ({normal: n}: Triangle) => R.flatten<number>([n, n, n]);
    return R.flatten<number>(triangles.map(triangleVertexNormals));
}

const sum = (values: number[][]) => values.reduce(add);
const midPosition = (values: number[][]) => div(sum(values), values.length);

export function getMeshTriangleNormals(model: MD5Mesh, index: number): number[] {
    const { triangles, vertices } = model.meshes[index];

    const vertexPosition = (i: number) => vertices[i].position;
    const getPositionAndNormal = (triangle: Triangle) => {
        const position = midPosition(triangle.indices.map(vertexPosition));
        return [ ...position, ...add(position, triangle.normal) ];
    };

    return R.flatten<number>(triangles.map(getPositionAndNormal));
}

export function getMeshTriangleTangents(model: MD5Mesh, index: number): number[] {
    const { triangles, vertices } = model.meshes[index];

    const vertexPosition = (i: number) => vertices[i].position;
    const getPositionAndTangent = (triangle: Triangle) => {
        const position = midPosition(triangle.indices.map(vertexPosition));
        return [ ...position, ...add(position, triangle.tangent) ];
    };

    return R.flatten<number>(triangles.map(getPositionAndTangent));
}

export function getMeshTriangleBitangents(model: MD5Mesh, index: number): number[] {
    const { triangles, vertices } = model.meshes[index];

    const vertexPosition = (i: number) => vertices[i].position;
    const getPositionAndBitangent = (triangle: Triangle) => {
        const position = midPosition(triangle.indices.map(vertexPosition));
        return [ ...position, ...add(position, triangle.bitangent) ];
    };

    return R.flatten<number>(triangles.map(getPositionAndBitangent));
}

const getVertexVector = R.curry((triangles: Triangle[],
                                 getVector: (t: Triangle) => number[],
                                 vertex: Vertex): number[] => {
    const vertexIsIncluded = ({indices}: Triangle) => indices.includes(vertex.index);
    const normalsSum = triangles
        .filter(vertexIsIncluded)
        .map(getVector)
        .reduce(add);
    return normalize(normalsSum);
});

export function getMeshVertexNormalsDebug(model: MD5Mesh, index: number): number[] {
    const { vertices, triangles } = model.meshes[index];

    const getPositionAndNormal = (vertex: Vertex) => {
        const normal = getVertexVector(triangles, t => t.normal, vertex);
        return [ ...vertex.position, ...add(vertex.position, normal) ];
    };

    return R.flatten<number>(vertices.map(getPositionAndNormal));
}

export function getMeshVertexTangentsDebug(model: MD5Mesh, index: number): number[] {
    const { vertices, triangles } = model.meshes[index];

    const getPositionAndNormal = (vertex: Vertex) => {
        const normal = getVertexVector(triangles, t => t.tangent, vertex);
        return [ ...vertex.position, ...add(vertex.position, normal) ];
    };

    return R.flatten<number>(vertices.map(getPositionAndNormal));
}

export function getMeshVertexBitangentsDebug(model: MD5Mesh, index: number): number[] {
    const { vertices, triangles } = model.meshes[index];

    const getPositionAndNormal = (vertex: Vertex) => {
        const normal = getVertexVector(triangles, t => t.bitangent, vertex);
        return [ ...vertex.position, ...add(vertex.position, normal) ];
    };

    return R.flatten<number>(vertices.map(getPositionAndNormal));
}

export function getMeshVertexNormals(model: MD5Mesh, index: number): number[] {
    const { vertices, triangles } = model.meshes[index];
    const normalFromVertex = getVertexVector(triangles, t => t.normal);
    return R.flatten<number>(vertices.map(normalFromVertex));
}
