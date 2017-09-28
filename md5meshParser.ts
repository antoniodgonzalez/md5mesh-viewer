import { MD5Mesh, Joint, Vertex, Triangle, Weight } from "./md5mesh";
import { quat, vec3 } from "gl-matrix";

const fromPattern = (pattern: string) => new RegExp(pattern.replace(/\ /g, "\\s*"));
const num = "(-?\\d+\\.?\\d*)";

const jointsRegEx = /joints\s*{([\s\S]*?)}/g;
const jointRegEx = fromPattern(`"(.*?)" ${num} \\( ${num} ${num} ${num} \\) \\( ${num} ${num} ${num} \\)`);
const meshRegEx = /mesh\s*{([\s\S]*?)}/g;
const shaderRegEx =  /shader\s*"(.*?)"/;
const vertexRegEx = fromPattern(`vert ${num} \\( ${num} ${num} \\) ${num} ${num}`);
const triangleRegEx = fromPattern(`tri ${num} ${num} ${num} ${num}`);
const weightRegEx = fromPattern(`weight ${num} ${num} ${num} \\( ${num} ${num} ${num} \\)`);

function createUnitQuaternion(x: number, y: number, z: number): quat {
    const t = 1.0 - x * x - y * y - z * z;
    const w = t < 0.0 ? 0.0 : -Math.sqrt (t);
    return quat.fromValues(x, y, z, w);
}

const parseInt10 = (x: string) => parseInt(x, 10);

function getJoints(md5meshSource: string): Joint[] {
    const x = jointsRegEx.exec(md5meshSource);
    if (!x) {
        return [];
    }

    const jointsString = x[1];
    return jointsString.split("\n")
        .map(line => jointRegEx.exec(line))
        .filter(j => j !== null)
        .map((j: RegExpExecArray) => ({
            name: j[1],
            parent: parseInt10(j[2]),
            position: vec3.fromValues(parseFloat(j[3]), parseFloat(j[4]), parseFloat(j[5])),
            orientation: createUnitQuaternion(parseFloat(j[6]), parseFloat(j[7]), parseFloat(j[8]))
        }));
}

function getVertices(meshString: string): Vertex[] {
    return meshString.split("\n")
        .map(line => vertexRegEx.exec(line))
        .filter(v => v !== null)
        .map((v: RegExpExecArray) => ({
            index: parseInt10(v[1]),
            u: parseFloat(v[2]),
            v: parseFloat(v[3]),
            startWeight: parseInt10(v[4]),
            countWeight: parseInt10(v[5])
        }));
}

function getTriangles(meshString: string): Triangle[] {
    return meshString.split("\n")
        .map(line => triangleRegEx.exec(line))
        .filter(t => t !== null)
        .map((w: RegExpExecArray) => ({
            index: parseInt10(w[1]),
            v1: parseInt10(w[2]),
            v2: parseInt10(w[3]),
            v3: parseInt10(w[4])
        }));
}

function getWeights(meshString: string): Weight[] {
    return meshString.split("\n")
        .map(line => weightRegEx.exec(line))
        .filter(w => w !== null)
        .map((w: RegExpExecArray) => ({
            index: parseInt10(w[1]),
            joint: parseInt10(w[2]),
            bias: parseFloat(w[3]),
            position: vec3.fromValues(parseFloat(w[4]), parseFloat(w[5]), parseFloat(w[6]))
        }));
}

export function getModel(md5meshSource: string): MD5Mesh {
    const md5mesh: MD5Mesh = {
        joints: getJoints(md5meshSource),
        meshes: []
    };

    let x = meshRegEx.exec(md5meshSource);
    while (x !== null) {
        const meshString = x[1];
        const shader = shaderRegEx.exec(meshString);
        md5mesh.meshes.push({
            shader: shader ? shader[1] : "",
            vertices: getVertices(meshString),
            triangles: getTriangles(meshString),
            weights: getWeights(meshString)
        });

        x = meshRegEx.exec(md5meshSource);
    }

    return md5mesh;
}
