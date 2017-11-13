declare module "gl-matrix" {

    type Quaternion = ReadonlyArray<number>;

    export module quat {
        export function create(): Quaternion;
        export function mul(out: Quaternion, a: Quaternion, b: Quaternion): Quaternion;
        export function conjugate(out: Quaternion, a: Quaternion): Quaternion;
        export function normalize(out: Quaternion, a: Quaternion): Quaternion;
        export function slerp(out: Quaternion, a: Quaternion, b: Quaternion, t: number): Quaternion;
    }
}