import * as twgl from "twgl.js";
import { MD5Mesh, Mesh } from "./md5mesh";
import {
    getMeshVertices,
    getMeshTriangles,
    getMeshTexCoords,
    getJointsVertices,
    getMeshTriangleNormals,
    getMeshVertexNormals
} from "./md5meshArrays";

interface RenderingMesh {
    arrays: twgl.Arrays;
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

export function getRenderingJoints(gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh {
    const arrays = {
        position: getJointsVertices(md5Mesh)
    };

    return {
        arrays,
        bufferInfo: twgl.createBufferInfoFromArrays(gl, arrays)
    };
}

export function getRenderingTriangleNormals(gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh[] {
    return md5Mesh.meshes.map((mesh, i) => {
        const arrays = {
            position: getMeshTriangleNormals(md5Mesh, i)
        };

        return {
            arrays,
            bufferInfo: twgl.createBufferInfoFromArrays(gl, arrays)
        };
    });
}

export function getRenderingVertexNormals(gl: WebGLRenderingContext, md5Mesh: MD5Mesh): RenderingMesh[] {
    return md5Mesh.meshes.map((mesh, i) => {
        const arrays = {
            position: getMeshVertexNormals(md5Mesh, i)
        };

        return {
            arrays,
            bufferInfo: twgl.createBufferInfoFromArrays(gl, arrays)
        };
    });
}

export function getRenderingMeshes(gl: WebGLRenderingContext, md5Mesh: MD5Mesh): TexturedRenderingMesh[] {
    return md5Mesh.meshes.map((mesh, i) => {
        const arrays = {
            position: getMeshVertices(md5Mesh, i),
            texCoord: getMeshTexCoords(md5Mesh, i),
            indices: getMeshTriangles(md5Mesh, i)
        };

        return {
            arrays,
            bufferInfo: twgl.createBufferInfoFromArrays(gl, arrays),
            textures: getMeshTextures(gl, mesh)
        };
    });
}
