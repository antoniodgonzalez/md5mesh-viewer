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
            uv: [parseFloat(x[2]),  parseFloat(x[3])],
            startWeight,
            countWeight,
            position: getVertexPosition(startWeight, countWeight, weights, joints)
        };
    };
    return getParsedLines(meshString, vertexRegEx).map(toVertex);
}

// ref: http://www.terathon.com/code/tangent.html
function triangleNormals(vertices: Vertex[]) {
    const p = vertices.map(v => v.position);
    const deltaPos1 = sub(p[2], p[0]);
    const deltaPos2 = sub(p[1], p[0]);
    const normal = normalize(cross(deltaPos1, deltaPos2));

    const q = vertices.map(v => v.uv);
    const deltaUV1 = sub(q[2], q[0]);
    const deltaUV2 = sub(q[1], q[0]);

    const r = 1 / (deltaUV1[0] * deltaUV2[1] - deltaUV1[1] * deltaUV2[0]);
    const tangent = normalize(mul(sub(mul(deltaPos1, deltaUV2[1]), mul(deltaPos2, deltaUV1[1])), r));
    const bitangent = normalize(mul(sub(mul(deltaPos2, deltaUV1[0]), mul(deltaPos1, deltaUV2[0])), r));

    return {
        normal,
        tangent,
        bitangent
    };
}

function getTriangles(meshString: string, vertices: Vertex[]): Triangle[] {
    const toTriangle = (x: RegExpExecArray): Triangle => {
        const asInt = (i: number) => parseInt10(x[i]);
        const vertexIndices = [asInt(2), asInt(3), asInt(4)];
        const triangleVertices = vertexIndices.map(i => vertices[i]);
        return {
            index: asInt(1),
            indices: vertexIndices,
            ...triangleNormals(triangleVertices)
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
