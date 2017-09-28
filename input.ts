let angle = 0;
let accel = 0.001;

export function init() {
    document.onmousemove = (event) => {
        if (event.buttons === 1) {
            const factor = 500;
            accel += event.movementX / factor;
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
