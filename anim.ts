import { Joint, MD5Mesh } from "./md5mesh";
import { BaseFrame, Hierarchy, Frame, MD5Anim } from "./md5anim";
import { createUnitQuaternion, rotate } from "./quaternion";
import { normalize, mul } from "./quaternion";
import { add, flatten } from "./vector";
import { RenderingMesh } from "./rendering";
import * as twgl from "twgl.js";

// tslint:disable:no-bitwise

const animateJoint = (joint: Joint, baseFrame: BaseFrame, hierarchy: Hierarchy, frame: Frame, parent: Joint): Joint => {
    let j = 0;
    const tx = hierarchy.flags & 1 ? frame.components[hierarchy.startIndex + j++] : baseFrame.position[0];
    const ty = hierarchy.flags & 2 ? frame.components[hierarchy.startIndex + j++] : baseFrame.position[1];
    const tz = hierarchy.flags & 4 ? frame.components[hierarchy.startIndex + j++] : baseFrame.position[2];
    const position = [tx, ty, tz];

    const qx = hierarchy.flags & 8 ? frame.components[hierarchy.startIndex + j++] : baseFrame.orientation[0];
    const qy = hierarchy.flags & 16 ? frame.components[hierarchy.startIndex + j++] : baseFrame.orientation[1];
    const qz = hierarchy.flags & 32 ? frame.components[hierarchy.startIndex + j++] : baseFrame.orientation[2];
    const orientation = createUnitQuaternion(qx, qy, qz);

    return hierarchy.parent === -1 ? {
        parent: hierarchy.parent,
        position,
        orientation
    } : {
        parent: hierarchy.parent,
        position: add(rotate(parent.orientation, position), parent.position),
        orientation: normalize(mul(parent.orientation, orientation))
    };
};

const animate = (mesh: MD5Mesh, anim: MD5Anim, frameIndex: number): ReadonlyArray<Joint> =>
    mesh.joints
        .map((joint, i) => ({joint, hierarchy: anim.hierarchy[i], baseFrame: anim.baseFrame[i]}))
        .reduce((animatedJoints, x) =>
            [...animatedJoints,
                animateJoint(x.joint, x.baseFrame, x.hierarchy, anim.frames[frameIndex],
                             animatedJoints[x.hierarchy.parent])]
        , []);

const getJointsVertices = (md5Mesh: MD5Mesh, md5Anim: MD5Anim, frameIndex: number): ReadonlyArray<number> => {
    const joints = animate(md5Mesh, md5Anim, frameIndex);
    const hasParent = (j: Joint) => j.parent !== -1;
    const getJointVertices = (j: Joint) => [...joints[j.parent].position, ...j.position];
    return flatten(joints.filter(hasParent).map(getJointVertices));
};

export const getRenderingJointsFrame = (gl: WebGLRenderingContext,
                                        md5Mesh: MD5Mesh, md5Anim: MD5Anim, frameIndex: number): RenderingMesh => ({
    bufferInfo: twgl.createBufferInfoFromArrays(gl, { position: getJointsVertices(md5Mesh, md5Anim, frameIndex) })
});
