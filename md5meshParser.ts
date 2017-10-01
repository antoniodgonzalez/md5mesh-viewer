import { MD5Mesh, Joint, Vertex, Triangle, Weight, Mesh } from "./md5mesh";
import { createUnitQuaternion, rotate } from "./quaternion";
import { vec3 } from "gl-matrix";
import { add, sub, cross, normalize, mul } from "./vector";

const fromPattern = (pattern: string) => new RegExp(pattern.replace(/\ /g, "\\s*"));
const num = "(-?\\d+\\.?\\d*)";

const jointsRegEx = /joints\s*{([\s\S]*?)}/g;
const jointRegEx = fromPattern(`"(.*?)" ${num} \\( ${num} ${num} ${num} \\) \\( ${num} ${num} ${num} \\)`);
const meshRegEx = /mesh\s*{([\s\S]*?)}/g;
const shaderRegEx =  /shader\s*"(.*?)"/;
const vertexRegEx = fromPattern(`vert ${num} \\( ${num} ${num} \\) ${num} ${num}`);
const triangleRegEx = fromPattern(`tri ${num} ${num} ${num} ${num}`);
const weightRegEx = fromPattern(`weight ${num} ${num} ${num} \\( ${num} ${num} ${num} \\)`);

const parseInt10 = (x: string) => parseInt(x, 10);

function getParsedLines(input: string, regExp: RegExp): RegExpExecArray[] {
    // TODO Why this does not work?: const tryParseLine = regExp.exec;
    const tryParseLine = (line: string) => regExp.exec(line);
    const lineHasParsed = (x: RegExpExecArray) => x !== null;
    const lines = input.split("\n");
    return lines.map(tryParseLine).filter(lineHasParsed) as RegExpExecArray[];
}

function getJoints(md5meshSource: string): Joint[] {
    const x = jointsRegEx.exec(md5meshSource);
    if (!x) {
        return [];
    }

    const jointsString = x[1];
    return getParsedLines(jointsString, jointRegEx)
        .map(j => ({
            name: j[1],
            parent: parseInt10(j[2]),
            position: [parseFloat(j[3]), parseFloat(j[4]), parseFloat(j[5])],
            orientation: createUnitQuaternion(parseFloat(j[6]), parseFloat(j[7]), parseFloat(j[8]))
        }));
}

function getVertexPosition(startWeight: number, countWeight: number, weights: Weight[], joints: Joint[]): number[] {
    const calculateWeightedPosition = (weight: Weight): number[] => {
        const joint = joints[weight.joint];
        const rotated = rotate(joint.orientation, weight.position);
        return mul(add(joint.position, rotated), weight.bias);
    };

    return weights.slice(startWeight, startWeight + countWeight).map(calculateWeightedPosition).reduce(add);
}

function getVertices(meshString: string, weights: Weight[], joints: Joint[]): Vertex[] {
    const toVertex = (x: RegExpExecArray) => {
        const startWeight = parseInt10(x[4]);
        const countWeight = parseInt10(x[5]);
        return {
            index: parseInt10(x[1]),
            u: parseFloat(x[2]),
            v: parseFloat(x[3]),
            startWeight,
            countWeight,
            position: getVertexPosition(startWeight, countWeight, weights, joints)
        };
    };
    return getParsedLines(meshString, vertexRegEx).map(toVertex);
}

function triangleNormal(v1: number, v2: number, v3: number, vertices: Vertex[]) {
    const p = [
        vertices[v1].position,
        vertices[v2].position,
        vertices[v3].position
    ];

    const vecA = sub(p[2], p[0]);
    const vecB = sub(p[1], p[0]);
    return normalize(cross(vecA, vecB));
}

function getTriangles(meshString: string, vertices: Vertex[]): Triangle[] {
    const toTriangle = (x: RegExpExecArray): Triangle => {
        const v1 = parseInt10(x[2]);
        const v2 = parseInt10(x[3]);
        const v3 = parseInt10(x[4]);
        return {
            index: parseInt10(x[1]),
            v1,
            v2,
            v3,
            normal: triangleNormal(v1, v2, v3, vertices)
        };
    };
    return getParsedLines(meshString, triangleRegEx).map(toTriangle);
}

function getWeights(meshString: string): Weight[] {
    const toWeight = (x: RegExpExecArray) => ({
        index: parseInt10(x[1]),
        joint: parseInt10(x[2]),
        bias: parseFloat(x[3]),
        position: vec3.fromValues(parseFloat(x[4]), parseFloat(x[5]), parseFloat(x[6]))
    });
    return getParsedLines(meshString, weightRegEx).map(toWeight);
}

const getShader = (meshString: string): string => {
    const x = shaderRegEx.exec(meshString);
    return x !== null ? x[1] : "";
};

function getMesh(meshString: string, joints: Joint[]): Mesh {
    const weights = getWeights(meshString);
    const vertices = getVertices(meshString, weights, joints);
    const triangles = getTriangles(meshString, vertices);
    return {
        shader: getShader(meshString),
        vertices,
        triangles,
        weights
    };
}

export function getModel(md5meshSource: string): MD5Mesh {
    const joints = getJoints(md5meshSource);
    const getMeshes = (meshes: Mesh[] = []): Mesh[] => {
        const x = meshRegEx.exec(md5meshSource);
        return x === null ? meshes : getMeshes([ ...meshes, getMesh(x[1], joints)]);
    };

    return {
        joints,
        meshes: getMeshes()
    };
}
