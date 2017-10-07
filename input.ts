let angle = 0;
let accel = 0.001;
const lightPosition = [0, 0, 0];

export function init() {
    document.onmousemove = (event) => {
        if (event.buttons === 1) {
            const factor = 500;
            accel += event.movementX / factor;
        }
    };

    document.onkeydown = (event) => {
        switch (event.key) {
            case "ArrowRight":
                lightPosition[0] += 10;
                break;
            case "ArrowLeft":
                lightPosition[0] -= 10;
                break;
            case "ArrowUp":
                lightPosition[1] += 10;
                break;
            case "ArrowDown":
                lightPosition[1] -= 10;
                break;
        }
    };
}

export function update() {
    angle += accel;
    if (Math.abs(accel) > 0.001) {
        accel *= 0.99;
    }

    return angle;
}

export function getLightPosition(): number[] {
    return lightPosition;
}
