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
    getMeshTriangleBitangents
} from "./md5meshArrays";

export interface RenderingMesh {
    bufferInfo: twgl.BufferInfo;
}

interface TexturedRenderingMesh extends RenderingMesh {
    textures: {[key: string]: WebGLTexture};
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

function getRenderingMeshForLines(gl: WebGLRenderingContext, position: number[]): RenderingMesh {
    return {
        bufferInfo: twgl.createBufferInfoFromArrays(gl, { position })
    };
}

export function getRenderingJoints(gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh {
    return getRenderingMeshForLines(gl, getJointsVertices(md5Mesh));
}

export function getRenderingTriangleNormals(gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh[] {
    return md5Mesh.meshes.map((mesh, i) =>
        getRenderingMeshForLines(gl, getMeshTriangleNormals(md5Mesh, i)));
}

export function getRenderingTriangleTangents(gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh[] {
    return md5Mesh.meshes.map((mesh, i) =>
        getRenderingMeshForLines(gl, getMeshTriangleTangents(md5Mesh, i)));
}

export function getRenderingTriangleBitangents(gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh[] {
    return md5Mesh.meshes.map((mesh, i) =>
        getRenderingMeshForLines(gl, getMeshTriangleBitangents(md5Mesh, i)));
}

export function getRenderingVertexNormals(gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh[] {
    return md5Mesh.meshes.map((mesh, i) =>
        getRenderingMeshForLines(gl, getMeshVertexNormalsDebug(md5Mesh, i)));
}

export function getRenderingMeshTriangles(gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh[] {
    return md5Mesh.meshes.map((mesh, i) => {
        const arrays = {
            position: getMeshTrianglesPositions(md5Mesh, i),
            normal: getMeshTrianglesNormals(md5Mesh, i)
        };

        return {
            bufferInfo: twgl.createBufferInfoFromArrays(gl, arrays)
        };
    });
}

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
