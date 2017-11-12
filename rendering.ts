import * as twgl from "twgl.js";
import { MD5Mesh, Mesh, Joint } from "./md5mesh";
import { Vector } from "./vector";
import {
    getMeshVertices,
    getMeshTriangles,
    getMeshTexCoords,
    getJointsVertices,
    getMeshTriangleNormals,
    getMeshVertexNormals,
    getMeshTrianglesPositions,
    getMeshTrianglesNormals,
    getMeshVertexNormalsDebug,
    getVertexTriangleIndices
} from "./md5meshArrays";
import { getAnimatedPositions, Normal, getVertexNormals, getTriangleNormals } from "./anim";

export interface RenderingMesh {
    bufferInfo: twgl.BufferInfo;
}

export interface MeshTextures {
    [key: string]: WebGLTexture;
}

interface TexturedRenderingMesh extends RenderingMesh {
    textures: MeshTextures;
}

function getMeshTextures(gl: WebGLRenderingContext, mesh: Mesh) {
    const getSrc = (m: Mesh, type: string) => `models/${m.shader.split("/").pop()}_${type}.png`;
    return twgl.createTextures(gl, {
        d: {src: getSrc(mesh, "d")},
        local: {src: getSrc(mesh, "local")},
        h: {src: getSrc(mesh, "h")},
        s: {src: getSrc(mesh, "s")}
    });
}

const getRenderingMeshForLines = (gl: WebGLRenderingContext, position: ReadonlyArray<number>): RenderingMesh  => ({
    bufferInfo: twgl.createBufferInfoFromArrays(gl, { position })
});

export const getRenderingJoints = (gl: WebGLRenderingContext, joints: ReadonlyArray<Joint>): RenderingMesh =>
    getRenderingMeshForLines(gl, getJointsVertices(joints));

export const getRenderingTriangleNormals = (gl: WebGLRenderingContext, mesh: Mesh,
                                            positions: ReadonlyArray<Vector>,
                                            triangleNormals: ReadonlyArray<Normal>) => {
    const normals = getMeshTriangleNormals(mesh, positions, triangleNormals);
    return {
        normals: getRenderingMeshForLines(gl, normals.normals),
        tangents: getRenderingMeshForLines(gl, normals.tangents),
        bitangents: getRenderingMeshForLines(gl, normals.bitangents)
    };
};

export const getRenderingVertexNormals = (gl: WebGLRenderingContext, mesh: Mesh,
                                          positions: ReadonlyArray<Vector>,
                                          vertexNormals: ReadonlyArray<Normal>) => {
    const normals = getMeshVertexNormalsDebug(mesh, positions, vertexNormals);
    return {
        normals: getRenderingMeshForLines(gl, normals.normals),
        tangents: getRenderingMeshForLines(gl, normals.tangents),
        bitangents: getRenderingMeshForLines(gl, normals.bitangents)
    };
};

export const getRenderingMeshTriangles = (gl: WebGLRenderingContext, mesh: Mesh,
                                          positions: ReadonlyArray<Vector>,
                                          triangleNormals: ReadonlyArray<Normal>): RenderingMesh =>  {
    const arrays = {
        position: getMeshTrianglesPositions(mesh, positions),
        normal: getMeshTrianglesNormals(mesh, triangleNormals)
    };

    return {
        bufferInfo: twgl.createBufferInfoFromArrays(gl, arrays)
    };
};

export function getRenderingMeshes(gl: WebGLRenderingContext, md5Mesh: MD5Mesh): TexturedRenderingMesh[] {
    return md5Mesh.meshes.map(mesh => {
        const positions = getAnimatedPositions(mesh, md5Mesh.joints);
        const triangleNormals = getTriangleNormals(mesh, positions);
        const vertexNormals = getVertexNormals(mesh, triangleNormals, getVertexTriangleIndices(mesh));
        const arrays = {
            position: getMeshVertices(positions),
            normal: getMeshVertexNormals(mesh, vertexNormals),
            texCoord: getMeshTexCoords(md5Mesh, mesh),
            indices: getMeshTriangles(md5Mesh, mesh)
        };

        return {
            bufferInfo: twgl.createBufferInfoFromArrays(gl, arrays),
            textures: getMeshTextures(gl, mesh)
        };
    });
}
