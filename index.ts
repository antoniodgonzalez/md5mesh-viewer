import * as twgl from "twgl.js";
import { m4 } from "twgl.js";
import {
    RenderingMesh,
    MeshTextures,
    getRenderingMeshes,
    getRenderingJoints,
    getRenderingTriangleNormals,
    getRenderingVertexNormals,
    getRenderingMeshTriangles,
    getRenderingTriangleTangents,
    getRenderingTriangleBitangents,
    getRenderingVertexTangents,
    getRenderingVertexBitangents
} from "./rendering";
import { getMD5Mesh } from "./md5meshParser";
import { initSettingsUI, getSettings } from "./settingsUI";
import * as input from "./input";
import { getMD5Anim } from "./md5animParser";
import { getAnimatedJointsInterpolated } from "./anim";
import { MD5Mesh, Joint } from "./md5mesh";
import { MD5Anim } from "./md5anim";
import { getMeshVertices } from "./md5meshArrays";

const canvas = document.getElementById("glcanvas") as HTMLCanvasElement;
twgl.resizeCanvasToDisplaySize(canvas);

const gl = canvas.getContext("webgl") as WebGLRenderingContext;
if (!gl) {
    throw new Error("WebGL not supported");
}

gl.clearColor(0.9, 0.9, 0.9, 1);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.frontFace(gl.CW);
gl.cullFace(gl.BACK);

const md5meshSource = require("./models/zfat.md5mesh") as string;
const md5Mesh = getMD5Mesh(md5meshSource);

const md5animSource = require("./models/idle1.md5anim") as string;
const md5Anim = getMD5Anim(md5animSource);

const triangleNormals = getRenderingTriangleNormals(gl, md5Mesh);
const triangleTangents = getRenderingTriangleTangents(gl, md5Mesh);
const triangleBitangents = getRenderingTriangleBitangents(gl, md5Mesh);
const vertexNormals = getRenderingVertexNormals(gl, md5Mesh);
const vertexTangents = getRenderingVertexTangents(gl, md5Mesh);
const vertexBitangents = getRenderingVertexBitangents(gl, md5Mesh);
const meshTriangles = getRenderingMeshTriangles(gl, md5Mesh);
const meshes = getRenderingMeshes(gl, md5Mesh);

const createProgramInfo = (name: string) => twgl.createProgramInfo(gl, [
    require(`./shaders/${name}-vertex.glslx`) as string,
    require(`./shaders/${name}-fragment.glslx`) as string
]);

const solidProgramInfo = createProgramInfo("solid");
const flatProgramInfo = createProgramInfo("flat");
const shadedProgramInfo = createProgramInfo("shaded");
const textureProgramInfo = createProgramInfo("texture");
const mainProgramInfo = createProgramInfo("main");

const lightBufferInfo = twgl.createBufferInfoFromArrays(gl, { position: [0, 0, 0] });

const cameraPosition = [0, 100, 100];
const center = [0, 40, 0];
const matrices = {
    u_worldMatrix: m4.identity(),
    u_viewMatrix: m4.inverse(m4.lookAt(cameraPosition, center, [0, 1, 0])),
    u_projMatrix: []
};

function setProjectionMatrix(width: number, height: number) {
    m4.perspective(Math.PI / 4, width / height, 0.1, 1000, matrices.u_projMatrix);
}

setProjectionMatrix(canvas.width, canvas.height);

window.onresize = () => {
    twgl.resizeCanvasToDisplaySize(canvas);
    const {width, height} = canvas;
    gl.viewport(0, 0, width, height);
    setProjectionMatrix(width, height);
};

function renderJoints(joints: ReadonlyArray<Joint>) {
    const renderingJoints = getRenderingJoints(gl, joints);

    gl.useProgram(solidProgramInfo.program);
    twgl.setUniforms(solidProgramInfo, {
        ...matrices,
        u_color: [1, 0, 0]
    });

    twgl.setBuffersAndAttributes(gl, solidProgramInfo, renderingJoints.bufferInfo);
    gl.drawArrays(gl.LINES, 0, renderingJoints.bufferInfo.numElements);
}

const renderVectors = (renderingMesh: RenderingMesh, color: number[]) => {
    twgl.setUniforms(solidProgramInfo, {u_color: color});
    twgl.setBuffersAndAttributes(gl, solidProgramInfo, renderingMesh.bufferInfo);
    gl.drawArrays(gl.LINES, 0, renderingMesh.bufferInfo.numElements);
};

function renderTriangleNormals(i: number) {
    gl.useProgram(solidProgramInfo.program);
    twgl.setUniforms(solidProgramInfo, matrices);

    renderVectors(triangleNormals[i], [0, 0, 1]);
    renderVectors(triangleTangents[i], [0, 1, 0]);
    renderVectors(triangleBitangents[i], [1, 0, 0]);
}

function renderVertexNormals(i: number) {
    gl.useProgram(solidProgramInfo.program);
    twgl.setUniforms(solidProgramInfo, matrices);

    renderVectors(vertexNormals[i], [0, 0, 1]);
    renderVectors(vertexTangents[i], [0, 1, 0]);
    renderVectors(vertexBitangents[i], [1, 0, 0]);
}

function renderVertices(bufferInfo: twgl.BufferInfo) {
    gl.useProgram(solidProgramInfo.program);
    twgl.setUniforms(solidProgramInfo, {
        ...matrices,
        u_color: [1.0, 0.5, 0],
        u_pointSize: 3
    });

    twgl.setBuffersAndAttributes(gl, solidProgramInfo, bufferInfo);
    twgl.drawBufferInfo(gl, bufferInfo, gl.POINTS);
}

function renderFlatTriangles(bufferInfo: twgl.BufferInfo) {
    gl.useProgram(flatProgramInfo.program);
    twgl.setUniforms(flatProgramInfo, {
        ...matrices,
        u_lightPosition: input.getLightPosition(),
        u_color: [1, 1, 1]
    });

    twgl.setBuffersAndAttributes(gl, flatProgramInfo, bufferInfo);
    gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
}

function renderTexture(programInfo: twgl.ProgramInfo, bufferInfo: twgl.BufferInfo, texture: WebGLTexture) {
    gl.useProgram(programInfo.program);
    twgl.setUniforms(programInfo, {
        ...matrices,
        u_lightPosition: input.getLightPosition(),
        u_sampler: texture
    });

    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
}

function renderMesh(programInfo: twgl.ProgramInfo, bufferInfo: twgl.BufferInfo, textures: MeshTextures) {
    gl.useProgram(programInfo.program);
    twgl.setUniforms(programInfo, {
        ...matrices,
        u_color: [1, 1, 1],
        u_lightPosition: input.getLightPosition(),
        u_sampler_height: textures.h,
        u_sampler_diffuse: textures.d,
        u_sampler_specular: textures.s,
    });

    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
}

function renderLight() {
    gl.useProgram(solidProgramInfo.program);
    twgl.setUniforms(solidProgramInfo, {
        u_worldMatrix: m4.translate(m4.identity(), input.getLightPosition()),
        u_viewMatrix: matrices.u_viewMatrix,
        u_projMatrix: matrices.u_projMatrix,
        u_color: [1, 1, 1],
        u_pointSize: 10
    });

    twgl.setBuffersAndAttributes(gl, solidProgramInfo, lightBufferInfo);
    twgl.drawBufferInfo(gl, lightBufferInfo, gl.POINTS);
}

const animateJoints = (md5mesh: MD5Mesh, md5anim: MD5Anim, animation: string, frame: number): ReadonlyArray<Joint> =>
    animation === "bindPose" ? md5mesh.joints : getAnimatedJointsInterpolated(md5Anim, frame);

input.init();
initSettingsUI(md5Mesh, md5Anim);

let lastTime: number;
let currentFrame = 0;

const render: FrameRequestCallback = (time) => {
    const angleX = input.update();
    const angleY = Math.PI * 1.5;
    m4.rotateY(m4.identity(), angleX, matrices.u_worldMatrix);
    m4.rotateX(matrices.u_worldMatrix, angleY, matrices.u_worldMatrix);

    const deltaTime = lastTime ? (time - lastTime) / 1000 : 0;
    lastTime = time;
    currentFrame = (currentFrame + md5Anim.frameRate * deltaTime) % md5Anim.frames.length;

    gl.clear(gl.COLOR_BUFFER_BIT);

    const settings = getSettings();

    renderLight();

    const frame = settings.animation === "animated" ? currentFrame : settings.animationFrame;
    const joints = animateJoints(md5Mesh, md5Anim, settings.animation, frame);

    if (settings.skeleton) {
        renderJoints(joints);
    }

    meshes
        .forEach((mesh, i) => {
            const enabled = settings.meshes[i];
            if (!enabled) {
                return;
            }

            const position = getMeshVertices(md5Mesh, md5Mesh.meshes[i], joints);
            twgl.setAttribInfoBufferFromArray(gl, mesh.bufferInfo.attribs.position, position);

            if (settings.vertices) {
                renderVertices(mesh.bufferInfo);
            }

            if (settings.triangleNormals) {
                renderTriangleNormals(i);
            }

            if (settings.vertexNormals) {
                renderVertexNormals(i);
            }

            if (settings.flatGeometry) {
                renderFlatTriangles(meshTriangles[i].bufferInfo);
            }

            if (settings.shadedGeometry) {
                renderMesh(shadedProgramInfo, mesh.bufferInfo, mesh.textures);
            }

            if (settings.texture) {
                renderTexture(textureProgramInfo, mesh.bufferInfo, mesh.textures[settings.textureType]);
            }

            if (settings.full) {
                renderMesh(mainProgramInfo, mesh.bufferInfo, mesh.textures);
            }
        });

    requestAnimationFrame(render);
};

requestAnimationFrame(render);
