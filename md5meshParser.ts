import { MD5Mesh, Joint, Vertex, Triangle, Weight, Mesh } from "./md5mesh";
import { createUnitQuaternion } from "./quaternion";
import { getParsedLines, fromPattern, num, parseInt10, getSection, getSections, str } from "./parserUtils";

const getJointsSection = getSection("joints");

const jointRegEx = fromPattern(`${str} ${num} \\( ${num} ${num} ${num} \\) \\( ${num} ${num} ${num} \\)`);
const toJoint = (j: RegExpMatchArray): Joint => ({
    name: j[1],
    parent: parseInt10(j[2]),
    position: [parseFloat(j[3]), parseFloat(j[4]), parseFloat(j[5])],
    orientation: createUnitQuaternion(parseFloat(j[6]), parseFloat(j[7]), parseFloat(j[8]))
});

const getParsedJointLines = getParsedLines(jointRegEx);
const getJoints = (md5meshSource: string): Joint[] =>
    getParsedJointLines(getJointsSection(md5meshSource)).map(toJoint);

function getVertices(meshString: string): Vertex[] {
    const vertexRegEx = fromPattern(`vert ${num} \\( ${num} ${num} \\) ${num} ${num}`);
    const toVertex = (x: RegExpMatchArray) => {
        const startWeight = parseInt10(x[4]);
        const countWeight = parseInt10(x[5]);
        return {
            index: parseInt10(x[1]),
            uv: [parseFloat(x[2]),  parseFloat(x[3])],
            startWeight,
            countWeight
        };
    };
    return getParsedLines(vertexRegEx)(meshString).map(toVertex);
}

function getTriangles(meshString: string, vertices: Vertex[], weights: Weight[], joints: Joint[]): Triangle[] {
    const triangleRegEx = fromPattern(`tri ${num} ${num} ${num} ${num}`);
    const toTriangle = (x: RegExpMatchArray): Triangle => {
        const asInt = (i: number) => parseInt10(x[i]);
        return {
            index: asInt(1),
            indices: [asInt(2), asInt(3), asInt(4)]
        };
    };
    return getParsedLines(triangleRegEx)(meshString).map(toTriangle);
}

function getWeights(meshString: string): Weight[] {
    const weightRegEx = fromPattern(`weight ${num} ${num} ${num} \\( ${num} ${num} ${num} \\)`);
    const toWeight = (x: RegExpMatchArray) => ({
        index: parseInt10(x[1]),
        joint: parseInt10(x[2]),
        bias: parseFloat(x[3]),
        position: [parseFloat(x[4]), parseFloat(x[5]), parseFloat(x[6])]
    });
    return getParsedLines(weightRegEx)(meshString).map(toWeight);
}

const shaderRegEx = fromPattern(`shader ${str}`);
const getShader = (meshString: string): string => {
    const x = meshString.match(shaderRegEx);
    return x !== null ? x[1] : "";
};

const getMesh = (joints: Joint[]) => (meshString: string): Mesh => {
    const weights = getWeights(meshString);
    const vertices = getVertices(meshString);
    const triangles = getTriangles(meshString, vertices, weights, joints);
    return {
        shader: getShader(meshString),
        vertices,
        triangles,
        weights
    };
};

export function getMD5Mesh(md5meshSource: string): MD5Mesh {
    const joints = getJoints(md5meshSource);
    return {
        joints,
        meshes: getSections("mesh")(md5meshSource).map(getMesh(joints))
    };
}
