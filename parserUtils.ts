export const str = "\"(.*?)\"";
export const num = "(-?\\d+\\.?\\d*)";

export const parseInt10 = (x: string) => parseInt(x, 10);

export const fromPattern = (pattern: string, options?: string) =>
    new RegExp(pattern.replace(/\ /g, "\\s*"), options);

const getSectionRegExp = (name: string) =>
    new RegExp(`${name}\\s*{([\\s\\S]*?)}`, "g");

export const getSections = (name: string) => (md5meshSource: string): string[] =>
    md5meshSource.match(getSectionRegExp(name)) || [];

export const getSection = (name: string) => (md5meshSource: string): string =>
    getSections(name)(md5meshSource)[0];

export const getParsedLines = (regExp: RegExp) => (input: string): RegExpExecArray[] => {
    const tryParseLine = (line: string) => line.match(regExp);
    const lineHasParsed = (x: RegExpExecArray) => x !== null;
    return input.split("\n").map(tryParseLine).filter(lineHasParsed) as RegExpExecArray[];
};
