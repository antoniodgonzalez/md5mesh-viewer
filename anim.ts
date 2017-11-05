import { Joint, MD5Mesh } from "./md5mesh";
import { BaseFrame, Hierarchy, Frame, MD5Anim } from "./md5anim";
import { createUnitQuaternion, rotate } from "./quaternion";
import { normalize, mul } from "./quaternion";
import { add } from "./vector";

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

export const getAnimatedJoints = (mesh: MD5Mesh, anim: MD5Anim, frameIndex: number): ReadonlyArray<Joint> =>
    mesh.joints
        .map((joint, i) => ({joint, hierarchy: anim.hierarchy[i], baseFrame: anim.baseFrame[i]}))
        .reduce<ReadonlyArray<Joint>>((animatedJoints, x) =>
            animatedJoints.concat(
                animateJoint(x.joint, x.baseFrame, x.hierarchy, anim.frames[frameIndex],
                             animatedJoints[x.hierarchy.parent]))
        , []);
