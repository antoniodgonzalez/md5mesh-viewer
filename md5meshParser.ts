import { MD5Mesh, Joint, Vertex, Triangle, Weight, Mesh } from "./md5mesh";
import { createUnitQuaternion, rotate } from "./quaternion";
import { add, sub, cross, normalize, mul } from "./vector";
import { getParsedLines, fromPattern, num, parseInt10, getSection, getSections, str } from "./parserUtils";

const getJointsSection = getSection("joints");

const jointRegEx = fromPattern(`${str} ${num} \\( ${num} ${num} ${num} \\) \\( ${num} ${num} ${num} \\)`);
const toJoint = (j: RegExpExecArray): Joint => ({
    name: j[1],
    parent: parseInt10(j[2]),
    position: [parseFloat(j[3]), parseFloat(j[4]), parseFloat(j[5])],
    orientation: createUnitQuaternion(parseFloat(j[6]), parseFloat(j[7]), parseFloat(j[8]))
});

const getParsedJointLines = getParsedLines(jointRegEx);
const getJoints = (md5meshSource: string): Joint[] =>
    getParsedJointLines(getJointsSection(md5meshSource)).map(toJoint);

function getVertexPosition(startWeight: number, countWeight: number, weights: Weight[], joints: Joint[]): number[] {
    const calculateWeightedPosition = (weight: Weight): number[] => {
        const joint = joints[weight.joint];
        const rotated = rotate(joint.orientation, weight.position);
        return mul(add(joint.position, rotated), weight.bias);
    };

    return weights.slice(startWeight, startWeight + countWeight).map(calculateWeightedPosition).reduce(add);
}

function getVertices(meshString: string, weights: Weight[], joints: Joint[]): Vertex[] {
    const vertexRegEx = fromPattern(`vert ${num} \\( ${num} ${num} \\) ${num} ${num}`);
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
    return getParsedLines(vertexRegEx)(meshString).map(toVertex);
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
    const tangent = normalize(mul(sub(mul(deltaPos2, deltaUV1[0]), mul(deltaPos1, deltaUV2[0])), r));
    const bitangent = normalize(mul(sub(mul(deltaPos1, deltaUV2[1]), mul(deltaPos2, deltaUV1[1])), r));

    return {
        normal,
        tangent,
        bitangent
    };
}

function getTriangles(meshString: string, vertices: Vertex[]): Triangle[] {
    const triangleRegEx = fromPattern(`tri ${num} ${num} ${num} ${num}`);
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
    return getParsedLines(triangleRegEx)(meshString).map(toTriangle);
}

function getWeights(meshString: string): Weight[] {
    const weightRegEx = fromPattern(`weight ${num} ${num} ${num} \\( ${num} ${num} ${num} \\)`);
    const toWeight = (x: RegExpExecArray) => ({
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
    const vertices = getVertices(meshString, weights, joints);
    const triangles = getTriangles(meshString, vertices);
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
