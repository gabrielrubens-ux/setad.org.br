/**
 * logo-transparent.js — Remove fundo preto de logos com JavaScript puro (Canvas API).
 *
 * Como funciona:
 * 1. Lê os pixels da imagem no <canvas>
 * 2. Faz flood fill a partir das bordas, removendo pixels escuros conectados ao fundo
 * 3. Mantém elementos pretos internos (ex.: pomba) que não tocam o fundo
 * 4. Substitui o src da <img> pela versão PNG transparente gerada
 */
(function () {
  "use strict";

  var THRESHOLD = 40;

  function isDarkPixel(data, idx) {
    var i = idx * 4;
    return data[i] <= THRESHOLD && data[i + 1] <= THRESHOLD && data[i + 2] <= THRESHOLD;
  }

  function removeEdgeBlackBackground(data, width, height) {
    var total = width * height;
    var visited = new Uint8Array(total);
    var remove = new Uint8Array(total);
    var queue = [];

    function enqueue(x, y) {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      queue.push(y * width + x);
    }

    var x;
    var y;

    for (x = 0; x < width; x++) {
      enqueue(x, 0);
      enqueue(x, height - 1);
    }
    for (y = 0; y < height; y++) {
      enqueue(0, y);
      enqueue(width - 1, y);
    }

    while (queue.length > 0) {
      var idx = queue.pop();
      if (visited[idx]) continue;
      visited[idx] = 1;

      if (!isDarkPixel(data, idx)) continue;

      remove[idx] = 1;

      var px = idx % width;
      var py = Math.floor(idx / width);
      enqueue(px - 1, py);
      enqueue(px + 1, py);
      enqueue(px, py - 1);
      enqueue(px, py + 1);
    }

    for (idx = 0; idx < total; idx++) {
      if (remove[idx]) {
        data[idx * 4 + 3] = 0;
      }
    }

    // Suaviza bordas escuras coladas ao fundo removido (anti-halo)
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        idx = y * width + x;
        if (data[idx * 4 + 3] === 0) continue;

        var touchesTransparent = false;
        var neighbors = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ];

        for (var n = 0; n < neighbors.length; n++) {
          var nx = neighbors[n][0];
          var ny = neighbors[n][1];
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
            touchesTransparent = true;
            break;
          }
          if (data[(ny * width + nx) * 4 + 3] === 0) {
            touchesTransparent = true;
            break;
          }
        }

        if (!touchesTransparent) continue;

        var i = idx * 4;
        var r = data[i];
        var g = data[i + 1];
        var b = data[i + 2];

        if (r <= 80 && g <= 80 && b <= 80) {
          var factor = Math.max(r, g, b) / 80;
          data[i + 3] = Math.round(255 * factor * 0.85);
        }
      }
    }
  }

  function processImage(img) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d", { willReadFrequently: true });

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    removeEdgeBlackBackground(imageData.data, canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0);

    img.src = canvas.toDataURL("image/png");
    img.classList.add("hero__logo--ready");
  }

  function init() {
    var images = document.querySelectorAll("img[data-remove-bg]");

    images.forEach(function (img) {
      function run() {
        if (img.naturalWidth === 0) return;
        processImage(img);
      }

      if (img.complete) {
        run();
      } else {
        img.addEventListener("load", run, { once: true });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
