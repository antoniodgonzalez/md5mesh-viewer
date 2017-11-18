import { MD5Mesh, Joint, Triangle, Mesh, Vertex } from "./md5mesh";
import { add, div, Vector, flatten, sum } from "./vector";
import { Normal } from "./anim";

export function getJointsVertices(joints: ReadonlyArray<Joint>): ReadonlyArray<number> {
    const hasParent = (j: Joint) => j.parent !== -1;
    const getJointVertices = (j: Joint) => [...joints[j.parent].position, ...j.position];
    return flatten(joints.filter(hasParent).map(getJointVertices));
}

export const getMeshVertices = (vertices: ReadonlyArray<Vector>): ReadonlyArray<number> =>
    flatten(vertices);

export const getMeshTexCoords = (model: MD5Mesh, mesh: Mesh): ReadonlyArray<number> =>
    flatten(mesh.vertices.map(v => v.uv));

export const getMeshTriangles = (model: MD5Mesh, mesh: Mesh): ReadonlyArray<number> =>
    flatten(mesh.triangles.map(t => t.indices));

export const getMeshTrianglesPositions = (mesh: Mesh,
                                          positions: ReadonlyArray<Vector>): ReadonlyArray<number> => {
    const trianglePositions = ({indices}: Triangle) => flatten(indices.map(i => positions[i]));
    return flatten(mesh.triangles.map(trianglePositions));
};

export const getMeshTrianglesNormals = (mesh: Mesh,
                                        triangleNormals: ReadonlyArray<Normal>): ReadonlyArray<number> => {
    const triangleVertexNormals = ({index: i}: Triangle) =>
        flatten([triangleNormals[i].normal, triangleNormals[i].normal, triangleNormals[i].normal]);
    return flatten(mesh.triangles.map(triangleVertexNormals));
};

const midPosition = (values: Vector[]) => div(sum(values), values.length);

const getTriangleMidPosition = (positions: ReadonlyArray<Vector>) => (triangle: Triangle) =>
    midPosition(triangle.indices.map(i => positions[i]));

export const getMeshTriangleNormals = (mesh: Mesh,
                                       positions: ReadonlyArray<Vector>,
                                       triangleNormals: ReadonlyArray<Normal>) => {
    const positionAndNormals = mesh.triangles.map((t, i) => ({
        position: getTriangleMidPosition(positions)(t),
        ...triangleNormals[i]
    }));

    return {
        normals: flatten(positionAndNormals.map(x => [...x.position, ...add(x.position, x.normal)])),
        tangents: flatten(positionAndNormals.map(x => [...x.position, ...add(x.position, x.tangent)])),
        bitangents: flatten(positionAndNormals.map(x => [...x.position, ...add(x.position, x.bitangent)]))
    };
};

export function getMeshVertexNormalsDebug(mesh: Mesh,
                                          positions: ReadonlyArray<Vector>,
                                          vertexNormals: ReadonlyArray<Normal>) {

    const positionAndNormals = mesh.vertices.map((v, i) => ({
        position: positions[i],
        ...vertexNormals[i]
    }));

    return {
        normals: flatten(positionAndNormals.map(x => [...x.position, ...add(x.position, x.normal)])),
        tangents: flatten(positionAndNormals.map(x => [...x.position, ...add(x.position, x.tangent)])),
        bitangents: flatten(positionAndNormals.map(x => [...x.position, ...add(x.position, x.bitangent)]))
    };
}

export const getMeshVertexNormals = (mesh: Mesh, vertexNormals: ReadonlyArray<Normal>): ReadonlyArray<number> =>
    flatten(vertexNormals.map(n => n.normal));

export const getMeshVertexTangents = (mesh: Mesh, vertexNormals: ReadonlyArray<Normal>): ReadonlyArray<number> =>
    flatten(vertexNormals.map(n => n.tangent));

export const getMeshVertexBitangents = (mesh: Mesh, vertexNormals: ReadonlyArray<Normal>): ReadonlyArray<number> =>
    flatten(vertexNormals.map(n => n.bitangent));

const singleVertexTriangleIndices = (triangles: ReadonlyArray<Triangle>, vertex: Vertex): ReadonlyArray<number> =>
    triangles.filter(t => t.indices.includes(vertex.index)).map(t => t.index);

export const getVertexTriangleIndices = (mesh: Mesh): ReadonlyArray<ReadonlyArray<number>> =>
    mesh.vertices.map(v => singleVertexTriangleIndices(mesh.triangles, v));
