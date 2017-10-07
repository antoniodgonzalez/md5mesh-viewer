import {vec3, quat} from "gl-matrix";

export interface Joint {
    name: string;
    parent: number;
    position: number[];
    orientation: quat;
}

export interface Vertex {
    index: number;
    uv: number[];
    startWeight: number;
    countWeight: number;
    position: number[];
}

export interface Triangle {
    index: number;
    indices: number[];
    normal: number[];
    tangent: number[];
    bitangent: number[];
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
