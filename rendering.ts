import * as twgl from "twgl.js";
import { MD5Mesh, Mesh } from "./md5mesh";
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
    getMeshTriangleTangents,
    getMeshTriangleBitangents,
    getMeshVertexTangentsDebug,
    getMeshVertexBitangentsDebug
} from "./md5meshArrays";

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

const getRenderingMeshForLines = (gl: WebGLRenderingContext, position: number[]): RenderingMesh  => ({
    bufferInfo: twgl.createBufferInfoFromArrays(gl, { position })
});

export const getRenderingJoints = (gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh =>
    getRenderingMeshForLines(gl, getJointsVertices(md5Mesh));

export const getRenderingTriangleNormals = (gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh[] =>
    md5Mesh.meshes.map((mesh, i) =>
        getRenderingMeshForLines(gl, getMeshTriangleNormals(md5Mesh, i)));

export const getRenderingTriangleTangents = (gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh[] =>
    md5Mesh.meshes.map((mesh, i) =>
        getRenderingMeshForLines(gl, getMeshTriangleTangents(md5Mesh, i)));

export const getRenderingTriangleBitangents = (gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh[] =>
    md5Mesh.meshes.map((mesh, i) =>
        getRenderingMeshForLines(gl, getMeshTriangleBitangents(md5Mesh, i)));

export const getRenderingVertexNormals = (gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh[] =>
    md5Mesh.meshes.map((mesh, i) =>
        getRenderingMeshForLines(gl, getMeshVertexNormalsDebug(md5Mesh, i)));

export const getRenderingVertexTangents = (gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh[] =>
    md5Mesh.meshes.map((mesh, i) =>
        getRenderingMeshForLines(gl, getMeshVertexTangentsDebug(md5Mesh, i)));

export const getRenderingVertexBitangents = (gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh[] =>
    md5Mesh.meshes.map((mesh, i) =>
        getRenderingMeshForLines(gl, getMeshVertexBitangentsDebug(md5Mesh, i)));

export const getRenderingMeshTriangles = (gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh[] =>
    md5Mesh.meshes.map((mesh, i) => {
        const arrays = {
            position: getMeshTrianglesPositions(md5Mesh, i),
            normal: getMeshTrianglesNormals(md5Mesh, i)
        };

        return {
            bufferInfo: twgl.createBufferInfoFromArrays(gl, arrays)
        };
    });

export function getRenderingMeshes(gl: WebGLRenderingContext, md5Mesh: MD5Mesh): TexturedRenderingMesh[] {
    return md5Mesh.meshes.map((mesh, i) => {
        const arrays = {
            position: getMeshVertices(md5Mesh, i),
            normal: getMeshVertexNormals(md5Mesh, i),
            texCoord: getMeshTexCoords(md5Mesh, i),
            indices: getMeshTriangles(md5Mesh, i)
        };

        return {
            bufferInfo: twgl.createBufferInfoFromArrays(gl, arrays),
            textures: getMeshTextures(gl, mesh)
        };
    });
}
