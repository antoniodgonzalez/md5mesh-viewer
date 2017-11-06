import { Joint } from "./md5mesh";
import { BaseFrame, Hierarchy, Frame, MD5Anim } from "./md5anim";
import { createUnitQuaternion, rotate } from "./quaternion";
import { normalize, mul, slerp } from "./quaternion";
import { add, mul as vmul, sub } from "./vector";

// tslint:disable:no-bitwise

const framePositionAndOrientation = (baseFrame: BaseFrame, hierarchy: Hierarchy, frame: Frame) => {
    let j = 0;
    const tx = hierarchy.flags & 1 ? frame.components[hierarchy.startIndex + j++] : baseFrame.position[0];
    const ty = hierarchy.flags & 2 ? frame.components[hierarchy.startIndex + j++] : baseFrame.position[1];
    const tz = hierarchy.flags & 4 ? frame.components[hierarchy.startIndex + j++] : baseFrame.position[2];

    const qx = hierarchy.flags & 8 ? frame.components[hierarchy.startIndex + j++] : baseFrame.orientation[0];
    const qy = hierarchy.flags & 16 ? frame.components[hierarchy.startIndex + j++] : baseFrame.orientation[1];
    const qz = hierarchy.flags & 32 ? frame.components[hierarchy.startIndex + j++] : baseFrame.orientation[2];

    return {
        position: [tx, ty, tz],
        orientation: createUnitQuaternion(qx, qy, qz)
    };
};

const animateJoint = (baseFrame: BaseFrame, hierarchy: Hierarchy, frame: Frame, parent: Joint): Joint => {
    const {position, orientation} = framePositionAndOrientation(baseFrame, hierarchy, frame);
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

export const getAnimatedJoints = (anim: MD5Anim, frameIndex: number): ReadonlyArray<Joint> =>
    anim.hierarchy
        .map((hierarchy, i) => ({hierarchy, baseFrame: anim.baseFrame[i]}))
        .reduce<ReadonlyArray<Joint>>((animatedJoints, {hierarchy, baseFrame}) =>
            animatedJoints.concat(
                animateJoint(baseFrame, hierarchy, anim.frames[Math.floor(frameIndex)],
                             animatedJoints[hierarchy.parent]))
        , []);

export const getAnimatedJointsInterpolated = (anim: MD5Anim, frameIndex: number): ReadonlyArray<Joint> =>
    anim.hierarchy
        .map((hierarchy, i) => ({hierarchy, baseFrame: anim.baseFrame[i]}))
        .reduce<ReadonlyArray<Joint>>((animatedJoints, {hierarchy, baseFrame}) => {
            const frameA = Math.floor(frameIndex);
            const frameB = (frameA + 1) % anim.frames.length;
            const interpolation = frameIndex % 1;
            const jointA = animateJoint(baseFrame, hierarchy, anim.frames[frameA], animatedJoints[hierarchy.parent]);
            const jointB = animateJoint(baseFrame, hierarchy, anim.frames[frameB], animatedJoints[hierarchy.parent]);

            return animatedJoints.concat({
                parent: hierarchy.parent,
                position: add(jointA.position, vmul(sub(jointB.position, jointA.position), interpolation)),
                orientation: slerp(jointA.orientation, jointB.orientation, interpolation)
            });
        }, []);
