import * as twgl from "twgl.js";
import { glMatrix, mat4 } from "gl-matrix";
import { getRenderingMeshes, getRenderingJoints } from "./rendering";
import { getModel } from "./md5meshParser";
import { initSettingsUI, getSettings } from "./settingsUI";
import * as input from "./input";

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
const md5Mesh = getModel(md5meshSource);

const joints = getRenderingJoints(gl, md5Mesh);
const meshes = getRenderingMeshes(gl, md5Mesh);

const solidProgramInfo = twgl.createProgramInfo(gl, [
    require("./shaders/solid-vertex.glslx") as string,
    require("./shaders/solid-fragment.glslx") as string
]);

const programInfo = twgl.createProgramInfo(gl, [
    require("./shaders/vertex.glslx") as string,
    require("./shaders/fragment.glslx") as string
]);

const worldMatrix = mat4.identity(mat4.create());

const cameraPosition = [0, 100, 150];
const viewMatrix = mat4.lookAt(mat4.create(), cameraPosition, [0, 50, 0], [0, 1, 0]);

const projMatrix = mat4.create();

function setProjectionMatrix(width: number, height: number) {
    mat4.perspective(projMatrix, glMatrix.toRadian(45), width / height, 0.1, 1000);
}

setProjectionMatrix(canvas.width, canvas.height);

window.onresize = () => {
    twgl.resizeCanvasToDisplaySize(canvas);
    const {width, height} = canvas;
    gl.viewport(0, 0, width, height);
    setProjectionMatrix(width, height);
};

function renderJoints() {
    gl.useProgram(solidProgramInfo.program);
    twgl.setUniforms(solidProgramInfo, {
        u_worldMatrix: worldMatrix,
        u_viewMatrix: viewMatrix,
        u_projMatrix: projMatrix,
        u_color: [1.0, 0.0, 0]
    });

    twgl.setBuffersAndAttributes(gl, programInfo, joints.bufferInfo);
    gl.drawArrays(gl.LINES, 0, joints.bufferInfo.numElements);
}

function renderVertices(bufferInfo: twgl.BufferInfo) {
    gl.useProgram(solidProgramInfo.program);
    twgl.setUniforms(solidProgramInfo, {
        u_worldMatrix: worldMatrix,
        u_viewMatrix: viewMatrix,
        u_projMatrix: projMatrix,
        u_color: [1.0, 0.5, 0]
    });

    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.drawBufferInfo(gl, bufferInfo, gl.POINTS);
}

function renderMesh(bufferInfo: twgl.BufferInfo, texture: WebGLTexture) {
    gl.useProgram(programInfo.program);
    twgl.setUniforms(programInfo, {
        u_worldMatrix: worldMatrix,
        u_viewMatrix: viewMatrix,
        u_projMatrix: projMatrix
    });

    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.activeTexture(gl.TEXTURE0);

    gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
}

const identity = mat4.identity(mat4.create());

input.init();
initSettingsUI(md5Mesh);

function render() {
    const angleX = input.update();
    const angleY = Math.PI * 1.5;
    mat4.rotateY(worldMatrix, identity, angleX);
    mat4.rotateX(worldMatrix, worldMatrix, angleY);

    gl.clear(gl.COLOR_BUFFER_BIT);

    const settings = getSettings();

    if (settings.skeleton) {
        renderJoints();
    }

    meshes
        .filter((m, i) => settings.meshes[i])
        .forEach(mesh => {
            if (settings.vertices) {
                renderVertices(mesh.bufferInfo);
            }

            if (settings.texture) {
                renderMesh(mesh.bufferInfo, mesh.textures[settings.textureType]);
            }
        });

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
