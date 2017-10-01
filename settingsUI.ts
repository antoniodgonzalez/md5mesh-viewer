import { Mesh, MD5Mesh } from "./md5mesh";

interface Settings {
    skeleton: boolean;
    vertices: boolean;
    triangleNormals: boolean;
    vertexNormals: boolean;
    flatGeometry: boolean;
    texture: boolean;
    textureType: string; // "d" | "local" | "h" | "s";
    meshes: boolean[];
}

const skeletonCheck = document.getElementById("skeleton") as HTMLInputElement;
const verticesCheck = document.getElementById("vertices") as HTMLInputElement;
const triangleNormalsCheck = document.getElementById("triangle-normals") as HTMLInputElement;
const vertexNormalsCheck = document.getElementById("vertex-normals") as HTMLInputElement;
const flatGeometryCheck = document.getElementById("flat-geometry") as HTMLInputElement;
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

export const initSettingsUI = (model: MD5Mesh) => {
    model.meshes.forEach(addMeshCheckbox);
};

export const getSettings = (): Settings => ({
    skeleton: skeletonCheck.checked,
    vertices: verticesCheck.checked,
    triangleNormals: triangleNormalsCheck.checked,
    vertexNormals: vertexNormalsCheck.checked,
    flatGeometry: flatGeometryCheck.checked,
    texture: textureCheck.checked,
    textureType: textureSelect.value,
    meshes: meshCheckboxes.map(ch => ch.checked)
});
