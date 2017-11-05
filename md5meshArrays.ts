import { MD5Mesh, Joint, Triangle, Vertex, Mesh } from "./md5mesh";
import { add, div, normalize, Vector, flatten } from "./vector";
import { getVertexPosition } from "./md5meshParser";

export function getJointsVertices(joints: ReadonlyArray<Joint>): ReadonlyArray<number> {
    const hasParent = (j: Joint) => j.parent !== -1;
    const getJointVertices = (j: Joint) => [...joints[j.parent].position, ...j.position];
    return flatten(joints.filter(hasParent).map(getJointVertices));
}

export const getMeshVertices = (model: MD5Mesh, mesh: Mesh, joints: ReadonlyArray<Joint>): ReadonlyArray<number> =>
    flatten(mesh.vertices.map(getVertexPosition(mesh.weights, joints)));

export const getMeshTexCoords = (model: MD5Mesh, mesh: Mesh): ReadonlyArray<number> =>
    flatten(mesh.vertices.map(v => v.uv));

export const getMeshTriangles = (model: MD5Mesh, mesh: Mesh): ReadonlyArray<number> =>
    flatten(mesh.triangles.map(t => t.indices));

export function getMeshTrianglesPositions(model: MD5Mesh, index: number = 0): ReadonlyArray<number> {
    const { triangles, vertices } = model.meshes[index];
    const vertexPosition = getVertexPosition(model.meshes[index].weights, model.joints);
    const trianglePositions = ({indices}: Triangle) => flatten(indices.map(i => vertexPosition(vertices[i])));
    return flatten(triangles.map(trianglePositions));
}

export function getMeshTrianglesNormals(model: MD5Mesh, index: number = 0): ReadonlyArray<number> {
    const { triangles } = model.meshes[index];
    const triangleVertexNormals = ({normal: n}: Triangle) => flatten([n, n, n]);
    return flatten(triangles.map(triangleVertexNormals));
}

const sum = (values: Vector[]): Vector => values.reduce(add);
const midPosition = (values: Vector[]) => div(sum(values), values.length);

export function getMeshTriangleNormals(model: MD5Mesh, index: number): ReadonlyArray<number> {
    const { triangles, vertices } = model.meshes[index];

    const vertexPosition = getVertexPosition(model.meshes[index].weights, model.joints);
    const getPositionAndNormal = (triangle: Triangle) => {
        const position = midPosition(triangle.indices.map(i => vertexPosition(vertices[i])));
        return [ ...position, ...add(position, triangle.normal) ];
    };

    return flatten(triangles.map(getPositionAndNormal));
}

export function getMeshTriangleTangents(model: MD5Mesh, index: number): ReadonlyArray<number> {
    const { triangles, vertices } = model.meshes[index];

    const vertexPosition = getVertexPosition(model.meshes[index].weights, model.joints);
    const getPositionAndTangent = (triangle: Triangle) => {
        const position = midPosition(triangle.indices.map(i => vertexPosition(vertices[i])));
        return [ ...position, ...add(position, triangle.tangent) ];
    };

    return flatten(triangles.map(getPositionAndTangent));
}

export function getMeshTriangleBitangents(model: MD5Mesh, index: number): ReadonlyArray<number> {
    const { triangles, vertices } = model.meshes[index];

    const vertexPosition = getVertexPosition(model.meshes[index].weights, model.joints);
    const getPositionAndBitangent = (triangle: Triangle) => {
        const position = midPosition(triangle.indices.map(i => vertexPosition(vertices[i])));
        return [ ...position, ...add(position, triangle.bitangent) ];
    };

    return flatten(triangles.map(getPositionAndBitangent));
}

const getVertexVector = (triangles: Triangle[], getVector: (t: Triangle) => Vector, vertex: Vertex): Vector => {
    const vertexIsIncluded = ({indices}: Triangle) => indices.includes(vertex.index);
    const normalsSum = triangles
        .filter(vertexIsIncluded)
        .map(getVector)
        .reduce(add);
    return normalize(normalsSum);
};

export function getMeshVertexNormalsDebug(model: MD5Mesh, index: number): ReadonlyArray<number> {
    const { vertices, triangles } = model.meshes[index];

    const getPositionAndNormal = (vertex: Vertex) => {
        const normal = getVertexVector(triangles, t => t.normal, vertex);
        const vertexPosition = getVertexPosition(model.meshes[index].weights, model.joints)(vertex);
        return [ ...vertexPosition, ...add(vertexPosition, normal) ];
    };

    return flatten(vertices.map(getPositionAndNormal));
}

export function getMeshVertexTangentsDebug(model: MD5Mesh, index: number): ReadonlyArray<number> {
    const { vertices, triangles } = model.meshes[index];

    const getPositionAndNormal = (vertex: Vertex) => {
        const normal = getVertexVector(triangles, t => t.tangent, vertex);
        const vertexPosition = getVertexPosition(model.meshes[index].weights, model.joints)(vertex);
        return [ ...vertexPosition, ...add(vertexPosition, normal) ];
    };

    return flatten(vertices.map(getPositionAndNormal));
}

export function getMeshVertexBitangentsDebug(model: MD5Mesh, index: number): ReadonlyArray<number> {
    const { vertices, triangles } = model.meshes[index];

    const getPositionAndNormal = (vertex: Vertex) => {
        const normal = getVertexVector(triangles, t => t.bitangent, vertex);
        const vertexPosition = getVertexPosition(model.meshes[index].weights, model.joints)(vertex);
        return [ ...vertexPosition, ...add(vertexPosition, normal) ];
    };

    return flatten(vertices.map(getPositionAndNormal));
}

export const getMeshVertexNormals = (model: MD5Mesh, mesh: Mesh): ReadonlyArray<number> => {
    const { vertices, triangles } = mesh;
    const normalFromVertex = (v: Vertex) => getVertexVector(triangles, t => t.normal, v);
    return flatten(vertices.map(normalFromVertex));
};
