import { Joint, Mesh, Weight, Vertex } from "./md5mesh";
import { BaseFrame, Hierarchy, Frame, MD5Anim } from "./md5anim";
import { createUnitQuaternion, rotate } from "./quaternion";
import { normalize as qnormalize, mul as qmul, slerp } from "./quaternion";
import { add, mul, sub, Vector, cross, normalize, sum } from "./vector";

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
        orientation: qnormalize(qmul(parent.orientation, orientation))
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
                position: add(jointA.position, mul(sub(jointB.position, jointA.position), interpolation)),
                orientation: slerp(jointA.orientation, jointB.orientation, interpolation)
            });
        }, []);

const getVertexPosition = (weights: ReadonlyArray<Weight>, joints: ReadonlyArray<Joint>, vertex: Vertex): Vector => {
    const calculateWeightedPosition = (weight: Weight): Vector => {
        const joint = joints[weight.joint];
        const rotated = rotate(joint.orientation, weight.position);
        return mul(add(joint.position, rotated), weight.bias);
    };

    return sum(weights.slice(vertex.startWeight, vertex.startWeight + vertex.countWeight)
                .map(calculateWeightedPosition));
};

export const getAnimatedPositions = (mesh: Mesh, joints: ReadonlyArray<Joint>): ReadonlyArray<Vector> =>
    mesh.vertices.map(v => getVertexPosition(mesh.weights, joints, v));

export interface Normal {
    normal: Vector;
    tangent: Vector;
    bitangent: Vector;
}

const sub2 = (a: ReadonlyArray<number>, b: ReadonlyArray<number>) => [ a[0] - b[0], a[1] - b[1] ];

// ref: http://www.terathon.com/code/tangent.html
const getSingleTriangleNormals = (positions: ReadonlyArray<Vector>, texCoords: ReadonlyArray<Vector>): Normal => {
    const deltaPos1 = sub(positions[2], positions[0]);
    const deltaPos2 = sub(positions[1], positions[0]);
    const normal = normalize(cross(deltaPos1, deltaPos2));

    const deltaUV1 = sub2(texCoords[2], texCoords[0]);
    const deltaUV2 = sub2(texCoords[1], texCoords[0]);

    const r = 1 / (deltaUV1[0] * deltaUV2[1] - deltaUV1[1] * deltaUV2[0]);
    const tangent = normalize(mul(sub(mul(deltaPos2, deltaUV1[0]), mul(deltaPos1, deltaUV2[0])), r));
    const bitangent = cross(normal, tangent);

    return {
        normal,
        tangent,
        bitangent
    };
};

export const getTriangleNormals = (mesh: Mesh, positions: ReadonlyArray<Vector>): ReadonlyArray<Normal> =>
    mesh.triangles.map(({indices}) => getSingleTriangleNormals(
        indices.map(i => positions[i]),
        indices.map(i => mesh.vertices[i].uv)
    ));

const vertexNormal = (normals: ReadonlyArray<Normal>, indices: ReadonlyArray<number>): Normal => {
    const triangleNormals = indices.map(i => normals[i]);
    const normal = normalize(sum(triangleNormals.map(x => x.normal)));
    const tangent = normalize(sum(triangleNormals.map(x => x.tangent)));
    return {
        normal,
        tangent,
        bitangent: cross(normal, tangent)
    };
};

export const getVertexNormals =
    (mesh: Mesh, triangleNormals: ReadonlyArray<Normal>,
     vertexTriangleIndices: ReadonlyArray<ReadonlyArray<number>>): ReadonlyArray<Normal> =>
        mesh.vertices.map((v, i) => vertexNormal(triangleNormals, vertexTriangleIndices[i]));
