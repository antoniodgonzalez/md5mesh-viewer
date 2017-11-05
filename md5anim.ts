import { Quaternion } from "./quaternion";

export interface Hierarchy {
    name: string;
    parent: number;
    flags: number;
    startIndex: number;
}

export interface Bounds {
    min: ReadonlyArray<number>;
    max: ReadonlyArray<number>;
}

export interface BaseFrame {
    position: ReadonlyArray<number>;
    orientation: Quaternion;
}

export interface Frame {
    index: number;
    components: ReadonlyArray<number>;
}

export interface MD5Anim {
    hierarchy: ReadonlyArray<Hierarchy>;
    bounds: ReadonlyArray<Bounds>;
    baseFrame: ReadonlyArray<BaseFrame>;
    frames: ReadonlyArray<Frame>;
}
