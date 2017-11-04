import { Mesh, MD5Mesh } from "./md5mesh";
import { MD5Anim } from "./md5anim";

interface Settings {
    skeleton: boolean;
    vertices: boolean;
    triangleNormals: boolean;
    vertexNormals: boolean;
    flatGeometry: boolean;
    shadedGeometry: boolean;
    texture: boolean;
    textureType: string; // "d" | "local" | "h" | "s";
    meshes: boolean[];
    full: boolean;
    animation: string; // "bindPose" | "animated" | "frame";
    animationFrame: number;
}

const skeletonCheck = document.getElementById("skeleton") as HTMLInputElement;
const verticesCheck = document.getElementById("vertices") as HTMLInputElement;
const triangleNormalsCheck = document.getElementById("triangle-normals") as HTMLInputElement;
const vertexNormalsCheck = document.getElementById("vertex-normals") as HTMLInputElement;
const flatGeometryCheck = document.getElementById("flat-geometry") as HTMLInputElement;
const shadedGeometryCheck = document.getElementById("shaded-geometry") as HTMLInputElement;
const textureCheck = document.getElementById("texture") as HTMLInputElement;
const textureSelect = document.getElementById("textureType") as HTMLSelectElement;
const fullCheck = document.getElementById("full") as HTMLInputElement;
const meshesDiv = document.getElementById("meshes") as HTMLDivElement;
const meshCheckboxes: HTMLInputElement[] = [];
const animationBindPose = document.getElementById("animationBindPose") as HTMLInputElement;
const animationAnimated = document.getElementById("animationAnimated") as HTMLInputElement;
const animationFrame = document.getElementById("animationFrame") as HTMLInputElement;
const animationFrameInput = document.getElementById("frame") as HTMLInputElement;

function addMeshCheckbox(mesh: Mesh, i: number) {
    const div = document.createElement("div");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `mesh_${i}`;
    checkbox.checked = i === 0;
    meshCheckboxes.push(checkbox);
    div.appendChild(checkbox);
    const label = document.createElement("label");
    label.setAttribute("for", checkbox.id);
    label.innerText = mesh.shader.split("/").pop() as string;
    div.appendChild(label);
    meshesDiv.appendChild(div);
}

export const initSettingsUI = (model: MD5Mesh, anim: MD5Anim) => {
    model.meshes.forEach(addMeshCheckbox);
    animationFrameInput.max = (anim.frames.length - 1).toString();
};

const animationRadioButtons = [animationBindPose, animationAnimated, animationFrame];
const getAnimation = (): string =>
    (animationRadioButtons.find(x => x.checked) as HTMLInputElement).value;

export const getSettings = (): Settings => ({
    skeleton: skeletonCheck.checked,
    vertices: verticesCheck.checked,
    triangleNormals: triangleNormalsCheck.checked,
    vertexNormals: vertexNormalsCheck.checked,
    flatGeometry: flatGeometryCheck.checked,
    shadedGeometry: shadedGeometryCheck.checked,
    texture: textureCheck.checked,
    textureType: textureSelect.value,
    full: fullCheck.checked,
    meshes: meshCheckboxes.map(ch => ch.checked),
    animation: getAnimation(),
    animationFrame: parseInt(animationFrameInput.value, 10)
});
