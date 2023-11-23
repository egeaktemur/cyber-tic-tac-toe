function min(x, y) {
    if (x < y) {
        return x;
    }
    return y;
}
let unit = min(window.innerWidth, window.innerHeight) - 200;
let lineWidth = unit / 25;
let canvasUnit = unit / 3.1;
let paintings = [];
let ctxs = [];
var last = -1;
var game_finished = false;
var winner = null;
const canvases = [];
var finished = [false, false, false, false, false, false, false, false, false];
var tictacs = [
    [-1, -1, -1],
    [-1, -1, -1],
    [-1, -1, -1],];

var model;
const load_model = async () => {
    model = await tf.loadLayersModel("model.json");
    return model;
};
load_model();

window.addEventListener("load", () => {
    for (let a = 1; a < 4; a++) {
        for (let b = 1; b < 4; b++) {
            let i = 3 * (a - 1) + b - 1;
            paintings[i] = false;
            var canvas = document.getElementsByClassName("canvas")[i];
            canvas.height = canvasUnit;
            canvas.width = canvasUnit;
            canvas.fillStyle = "black";
            ctxs[i] = canvas.getContext("2d");
            ctxs[i].fillRect(0, 0, canvasUnit, canvasUnit);
            ctxs[i].lineWidth = lineWidth;
            ctxs[i].lineCap = "round";
            ctxs[i].strokeStyle = "white";
            ctxs[i].filter = "grayscale(1)";
            canvas.addEventListener("mousedown", (e) => {
                startPosition(a, b, i, e);
            });
            canvas.addEventListener("mouseup", (e) => {
                finishedPosition(a, b, i, e);
            });
            canvas.addEventListener("mousemove", (e) => {
                draw(a, b, i, e);
            });
        }
    }

    function scaleImageData(originalImageData, targetWidth, targetHeight) {
        const targetImageData = new ImageData(targetWidth, targetHeight);
        const h1 = originalImageData.height;
        const w1 = originalImageData.width;
        const h2 = targetImageData.height;
        const w2 = targetImageData.width;
        const kh = h1 / h2;
        const kw = w1 / w2;
        const cur_img1pixel_sum = new Int32Array(4);
        for (let i2 = 0; i2 < h2; i2 += 1) {
            for (let j2 = 0; j2 < w2; j2 += 1) {
                for (let i in cur_img1pixel_sum) cur_img1pixel_sum[i] = 0;
                let cur_img1pixel_n = 0;
                for (let i1 = Math.ceil(i2 * kh); i1 < (i2 + 1) * kh; i1 += 1) {
                    for (let j1 = Math.ceil(j2 * kw); j1 < (j2 + 1) * kw; j1 += 1) {
                        const cur_p1 = (i1 * w1 + j1) * 4;
                        for (let k = 0; k < 4; k += 1) {
                            cur_img1pixel_sum[k] += originalImageData.data[cur_p1 + k];
                        }
                        cur_img1pixel_n += 1;
                    }
                }
                const cur_p2 = (i2 * w2 + j2) * 4;
                for (let k = 0; k < 4; k += 1) {
                    targetImageData.data[cur_p2 + k] =
                        cur_img1pixel_sum[k] / cur_img1pixel_n;
                }
            }
        }
        return targetImageData;
    }

    function imagedata_to_image(imagedata) {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        canvas.width = imagedata.width;
        canvas.height = imagedata.height;
        ctx.putImageData(imagedata, 0, 0);
        var image = new Image();
        image.src = canvas.toDataURL();
        return image;
    }

    function startPosition(a, b, i, e) {
        if (!finished[i]) {
            paintings.splice(i, 1, true);
            draw(a, b, i, e);
        }
    }

    function finishedPosition(a, b, i, e) {
        if (!finished[i]) {
            paintings.splice(i, 1, false);
            ctxs[i].beginPath();
            var ImageData = ctxs[i].getImageData(0, 0, canvasUnit, canvasUnit);
            var scaledImageData = scaleImageData(ImageData, 28, 28);
            let canvas = document.getElementsByClassName("canvas")[i];
            let ctx = canvas.getContext("2d");
            var ImageData = ctxs[i].getImageData(0, 0, canvasUnit, canvasUnit);
            var scaledImgData = scaleImageData(ImageData, 28, 28);
            let tensor = tf.browser.fromPixels(scaledImgData, 1);
            tensor = tensor.div(255);
            tensor = tensor.expandDims(0);
            let prediction = model.predict(tensor);
            let data = prediction.dataSync();
            if (Math.max(...data) > 0.8) {
                let prediction_result = data.indexOf(Math.max(...data));
                if (last != prediction_result) {
                    finished[i] = true;
                    last = prediction_result;
                    tictacs[(i - (i % 3)) / 3][i % 3] = prediction_result;
                    fixcanvas(prediction_result, i);
                    console.log(prediction_result);
                    current_state = checkWinner();
                    if (current_state != null) {
                        game_finished = true;
                        winner = current_state;
                        console.log(current_state + " Won");
                    }
                } else {
                    resetcanvas(i);
                }
            } else {
                resetcanvas(i);
            }
        }
    }

    function resetcanvas(i) {
        var canvas = document.getElementsByClassName("canvas")[i];
        canvas.fillStyle = "black";
        ctxs[i] = canvas.getContext("2d");
        ctxs[i].fillRect(0, 0, canvasUnit, canvasUnit);
        ctxs[i].lineWidth = lineWidth;
        ctxs[i].lineCap = "round";
        ctxs[i].strokeStyle = "white";
        ctxs[i].filter = "grayscale(1)";
    }

    function fixcanvas(res, i) {
        resetcanvas(i);
        console.log(res);
        if (res == 0) {
            ctxs[i].lineWidth = lineWidth;
            ctxs[i].lineCap = "round";
            ctxs[i].strokeStyle = "white";
            ctxs[i].filter = "grayscale(1)";
            ctxs[i].ellipse(
                canvasUnit / 2,
                canvasUnit / 2,
                canvasUnit / 5,
                canvasUnit / 3,
                0,
                0,
                2 * Math.PI
            );
            ctxs[i].stroke();
        } else {
            ctxs[i].lineWidth = lineWidth;
            ctxs[i].lineCap = "round";
            ctxs[i].strokeStyle = "white";
            ctxs[i].filter = "grayscale(1)";
            ctxs[i].beginPath();
            ctxs[i].moveTo(canvasUnit / 2, canvasUnit / 5);
            ctxs[i].lineTo(canvasUnit / 2, canvasUnit - canvasUnit / 5);
            ctxs[i].stroke();
            ctxs[i].beginPath();
            ctxs[i].moveTo(canvasUnit / 3, canvasUnit - canvasUnit / 5);
            ctxs[i].lineTo((canvasUnit * 2) / 3, canvasUnit - canvasUnit / 5);
            ctxs[i].stroke();
            ctxs[i].beginPath();
            ctxs[i].moveTo(canvasUnit / 3, canvasUnit / 3.5);
            ctxs[i].lineTo(canvasUnit / 2, canvasUnit / 5);
            ctxs[i].stroke();
        }
    }

    function draw(a, b, i, e) {
        if (game_finished || finished[i] || !paintings[i]) {
            return;
        }
        var canvas = document.getElementsByClassName("canvas")[i]
        var rect = canvas.getBoundingClientRect();
        ctxs[i].lineTo(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
        ctxs[i].stroke();
        ctxs[i].beginPath();
        ctxs[i].moveTo(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
    }

    function checkWinner() {
        // check rows
        for (let i = 0; i < 3; i++) {
            if (tictacs[i].every((val) => val === 1)) {
                return "1";
            } else if (tictacs[i].every((val) => val === 0)) {
                return "O";
            }
        }

        // check columns
        for (let i = 0; i < 3; i++) {
            let column = tictacs.map((val) => val[i]);
            if (column.every((val) => val === 1)) {
                return "1";
            } else if (column.every((val) => val === 0)) {
                return "O";
            }
        }

        // check diagonals
        if (
            tictacs[0][0] === tictacs[1][1] &&
            tictacs[1][1] === tictacs[2][2] &&
            tictacs[0][0] === 1
        ) {
            return "1";
        } else if (
            tictacs[0][0] === tictacs[1][1] &&
            tictacs[1][1] === tictacs[2][2] &&
            tictacs[0][0] === 0
        ) {
            return "O";
        } else if (
            tictacs[0][2] === tictacs[1][1] &&
            tictacs[1][1] === tictacs[2][0] &&
            tictacs[0][2] === 1
        ) {
            return "1";
        } else if (
            tictacs[0][2] === tictacs[1][1] &&
            tictacs[1][1] === tictacs[2][0] &&
            tictacs[0][2] === 0
        ) {
            return "O";
        } else {
            if (tictacs.every((sublist) => !sublist.includes(-1))) {
                return "draw";
            }
        }
        return null;
    }
});