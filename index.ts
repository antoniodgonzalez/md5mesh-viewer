import * as twgl from "twgl.js";
import { m4 } from "twgl.js";
import {
    RenderingMesh,
    MeshTextures,
    getRenderingMeshes,
    getRenderingJoints,
    getRenderingTriangleNormals,
    getRenderingVertexNormals,
    getRenderingMeshTriangles
} from "./rendering";
import { getMD5Mesh } from "./md5meshParser";
import { initSettingsUI, getSettings, Settings } from "./settingsUI";
import * as input from "./input";
import { getMD5Anim } from "./md5animParser";
import {
    Normal,
    getAnimatedPositions,
    getAnimatedJointsInterpolated,
    getTriangleNormals,
    getVertexNormals
} from "./anim";
import { MD5Mesh, Joint, Mesh } from "./md5mesh";
import { MD5Anim } from "./md5anim";
import { getMeshVertices, getMeshVertexNormals, getMeshVertexTangents, getMeshVertexBitangents,
    getVertexTriangleIndices, getJointsVertices } from "./md5meshArrays";
import { Vector } from "./vector";

const canvas = document.getElementById("glcanvas") as HTMLCanvasElement;
twgl.resizeCanvasToDisplaySize(canvas);

const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext;
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

const renderingJoints = getRenderingJoints(gl, md5Mesh.joints);

const renderingMeshes = getRenderingMeshes(gl, md5Mesh);

const vertexTriangleIndices = md5Mesh.meshes.map(getVertexTriangleIndices);

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

function renderTriangleNormals(mesh: Mesh, positions: ReadonlyArray<Vector>, triangleNormals: ReadonlyArray<Normal>) {
    gl.useProgram(solidProgramInfo.program);
    twgl.setUniforms(solidProgramInfo, matrices);

    const normals = getRenderingTriangleNormals(gl, mesh, positions, triangleNormals);
    renderVectors(normals.normals, [0, 0, 1]);
    renderVectors(normals.tangents, [0, 1, 0]);
    renderVectors(normals.bitangents, [1, 0, 0]);
}

function renderVertexNormals(mesh: Mesh, positions: ReadonlyArray<Vector>, vertexNormals: ReadonlyArray<Normal>) {
    gl.useProgram(solidProgramInfo.program);
    twgl.setUniforms(solidProgramInfo, matrices);

    const normals = getRenderingVertexNormals(gl, mesh, positions, vertexNormals);
    renderVectors(normals.normals, [0, 0, 1]);
    renderVectors(normals.tangents, [0, 1, 0]);
    renderVectors(normals.bitangents, [1, 0, 0]);
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

function renderFlatTriangles(bufferInfo: twgl.BufferInfo, settings: Settings) {
    gl.useProgram(flatProgramInfo.program);
    twgl.setUniforms(flatProgramInfo, {
        ...matrices,
        u_lightPosition: input.getLightPosition(),
        u_color: [1, 1, 1],
        u_ambientIntensity: settings.lightingAmbient,
        u_diffuseIntensity: settings.lightingDiffuse
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

function renderMesh(programInfo: twgl.ProgramInfo, bufferInfo: twgl.BufferInfo, textures: MeshTextures,
                    settings: Settings) {
    gl.useProgram(programInfo.program);
    twgl.setUniforms(programInfo, {
        ...matrices,
        u_color: [1, 1, 1],
        u_lightPosition: input.getLightPosition(),
        u_sampler_height: textures.h,
        u_sampler_diffuse: textures.d,
        u_sampler_specular: textures.s,
        u_sampler_normal: textures.local,
        u_ambientIntensity: settings.lightingAmbient,
        u_diffuseIntensity: settings.lightingDiffuse,
        u_specularIntensity: settings.lightingSpecular,
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
        twgl.setAttribInfoBufferFromArray(gl, renderingJoints.bufferInfo.attribs.position, getJointsVertices(joints));
        renderJoints(joints);
    }

    renderingMeshes
        .forEach((renderingMesh, i) => {
            const enabled = settings.meshes[i];
            if (!enabled) {
                return;
            }

            const mesh = md5Mesh.meshes[i];

            const positions = getAnimatedPositions(mesh, joints);
            twgl.setAttribInfoBufferFromArray(gl, renderingMesh.bufferInfo.attribs.position,
                getMeshVertices(positions));

            const triangleNormals = getTriangleNormals(mesh, positions);
            const vertexNormals = getVertexNormals(mesh, triangleNormals, vertexTriangleIndices[i]);

            twgl.setAttribInfoBufferFromArray(gl, renderingMesh.bufferInfo.attribs.normal,
                getMeshVertexNormals(mesh, vertexNormals));
            twgl.setAttribInfoBufferFromArray(gl, renderingMesh.bufferInfo.attribs.tangent,
                getMeshVertexTangents(mesh, vertexNormals));
            twgl.setAttribInfoBufferFromArray(gl, renderingMesh.bufferInfo.attribs.bitangent,
                getMeshVertexBitangents(mesh, vertexNormals));

            if (settings.vertices) {
                renderVertices(renderingMesh.bufferInfo);
            }

            if (settings.triangleNormals) {
                renderTriangleNormals(mesh, positions, triangleNormals);
            }

            if (settings.vertexNormals) {
                renderVertexNormals(mesh, positions, vertexNormals);
            }

            if (settings.flatGeometry) {
                const meshTriangles = getRenderingMeshTriangles(gl, mesh, positions, triangleNormals);
                renderFlatTriangles(meshTriangles.bufferInfo, settings);
            }

            if (settings.shadedGeometry) {
                renderMesh(shadedProgramInfo, renderingMesh.bufferInfo, renderingMesh.textures, settings);
            }

            if (settings.texture) {
                const texture = renderingMesh.textures[settings.textureType];
                renderTexture(textureProgramInfo, renderingMesh.bufferInfo, texture);
            }

            if (settings.full) {
                renderMesh(mainProgramInfo, renderingMesh.bufferInfo, renderingMesh.textures, settings);
            }
        });

    requestAnimationFrame(render);
};

requestAnimationFrame(render);
