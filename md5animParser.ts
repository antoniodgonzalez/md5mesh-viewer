import { MD5Anim, Hierarchy, BaseFrame, Frame, Bounds } from "./md5anim";
import { getParsedLines, num, fromPattern, parseInt10, str, getSection } from "./parserUtils";
import { createUnitQuaternion } from "./quaternion";

const getHierarchySection = getSection("hierarchy");

const hierarchyRegEx = fromPattern(`${str} ${num} ${num} ${num}`);
const getHierarchy = (md5animSource: string): ReadonlyArray<Hierarchy> =>
    getParsedLines(hierarchyRegEx)(getHierarchySection(md5animSource))
        .map(h => ({
            name: h[1],
            parent: parseInt10(h[2]),
            flags: parseInt10(h[3]),
            startIndex: parseInt10(h[4])
        }));

const getBaseFrameSection = getSection("baseframe");

const baseFrameRegEx = fromPattern(`\\( ${num} ${num} ${num} \\) \\( ${num} ${num} ${num} \\)`);
const getBaseFrame = (md5animSource: string): ReadonlyArray<BaseFrame> =>
    getParsedLines(baseFrameRegEx)(getBaseFrameSection(md5animSource))
        .map(b => ({
            position: [parseFloat(b[1]), parseFloat(b[2]), parseFloat(b[3])],
            orientation: createUnitQuaternion(parseFloat(b[4]), parseFloat(b[5]), parseFloat(b[6]))
        }));

const getBoundsSection = getSection("bounds");

const boundRegEx = fromPattern(`\\( ${num} ${num} ${num} \\) \\( ${num} ${num} ${num} \\)`);
const getBounds = (md5animSource: string): ReadonlyArray<Bounds> =>
    getParsedLines(boundRegEx)(getBoundsSection(md5animSource))
        .map(b => ({
            min: [parseInt10(b[1]), parseInt10(b[2]), parseInt10(b[3])],
            max: [parseInt10(b[4]), parseInt10(b[5]), parseInt10(b[6])],
        }));

const toFrame = (index: string, components: string): Frame => ({
    index: parseInt10(index),
    components: components.trim().split(" ").map(parseFloat)
});

const framesRegEx = fromPattern(`frame ${num} {([\\s\\S]*?)}`, "g");
const frameRegEx = fromPattern(`frame ${num} {([\\s\\S]*?)}`);
const getFrames = (md5animSource: string): ReadonlyArray<Frame> =>
    (md5animSource.match(framesRegEx) || [])
        .map(frame => {
            const x = frame.match(frameRegEx) as RegExpMatchArray;
            return toFrame(x[1], x[2]);
        });

export const getMD5Anim = (md5animSource: string): MD5Anim => ({
    frameRate: 24,  // TODO: Read from source
    hierarchy: getHierarchy(md5animSource),
    baseFrame: getBaseFrame(md5animSource),
    bounds: getBounds(md5animSource),
    frames: getFrames(md5animSource)
});
