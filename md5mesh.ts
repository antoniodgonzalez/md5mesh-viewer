import {vec3, quat} from "gl-matrix";

export interface Joint {
    name: string;
    parent: number;
    position: vec3;
    orientation: quat;
}

export interface Vertex {
    index: number;
    u: number;
    v: number;
    startWeight: number;
    countWeight: number;
}

export interface Triangle {
    index: number;
    v1: number;
    v2: number;
    v3: number;
}

export interface Weight {
    index: number;
    joint: number;
    bias: number;
    position: vec3;
}

export interface Mesh {
    shader: string;
    vertices: Vertex[];
    triangles: Triangle[];
    weights: Weight[];
}

export interface MD5Mesh {
    joints: Joint[];
    meshes: Mesh[];
}
