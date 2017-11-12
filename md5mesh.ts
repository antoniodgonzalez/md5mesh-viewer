import { Quaternion } from "./quaternion";
import { Vector } from "./vector";

export interface Joint {
    name?: string;
    parent: number;
    position: ReadonlyArray<number>;
    orientation: Quaternion;
}

export interface Vertex {
    index: number;
    uv: number[];
    startWeight: number;
    countWeight: number;
}

export interface Triangle {
    index: number;
    indices: number[];
}

export interface Weight {
    index: number;
    joint: number;
    bias: number;
    position: Vector;
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
