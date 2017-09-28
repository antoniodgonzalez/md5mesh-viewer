import { Mesh, MD5Mesh } from "./md5mesh";

interface Settings {
    skeleton: boolean;
    vertices: boolean;
    texture: boolean;
    textureType: string; // "d" | "local" | "h" | "s";
    meshes: boolean[];
}

const skeletonCheck = document.getElementById("skeleton") as HTMLInputElement;
const verticesCheck = document.getElementById("vertices") as HTMLInputElement;
const textureCheck = document.getElementById("texture") as HTMLInputElement;
const textureSelect = document.getElementById("textureType") as HTMLSelectElement;
const meshesDiv = document.getElementById("meshes") as HTMLDivElement;
const meshCheckboxes: HTMLInputElement[] = [];

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

export function initSettingsUI(model: MD5Mesh) {
    for (let i = 0; i < model.meshes.length; i++) {
        const mesh = model.meshes[i];
        addMeshCheckbox(mesh, i);
    }
}

export const getSettings = (): Settings => ({
    skeleton: skeletonCheck.checked,
    vertices: verticesCheck.checked,
    texture: textureCheck.checked,
    textureType: textureSelect.value,
    meshes: meshCheckboxes.map(ch => ch.checked)
});
