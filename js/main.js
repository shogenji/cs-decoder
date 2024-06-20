/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *  Copyright (c) 2024, Rui Shogenji. All rights reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

// Put variables in global scope to make them available to the browser console.
const video = document.querySelector('video');
const canvas = window.canvas = document.querySelector('canvas');
const offscreen = document.createElement('canvas');

const debug = document.getElementById('debug');
const btnInterval = document.getElementById('btnInterval');

let stream;
let settings;

let requestAnimationFrame = window.self.requestAnimationFrame;

let decoded_ctx = canvas.getContext('2d');

let offscreen_ctx = offscreen.getContext('2d');

let interval = 3;
let match = location.search.match(/i=(.*?)(&|$)/);
if(match) {
    interval = decodeURIComponent(match[1]);
}
btnInterval.innerText = interval;
console.log("interval: " + interval);

let offset_x = 0;
let offset_y = 0;

let type = screen.orientation.type;
let angle = screen.orientation.angle;


const constraints = {
  video: {
    width: {min: 640, ideal: 1920, max: 1920},
    height: {min: 400, ideal: 1080},
    frameRate: {max: 30},
    facingMode: {exact: 'environment'},
  }
};


function handleSuccess(stream) {
  window.stream = stream; // make stream available to browser console
  video.srcObject = stream;
  video.play();

  getSettings(stream);

  requestAnimationFrame(loop);
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);

function loop() {
  // console.log("settings.width: " + settings.width + "  settings.height: " + settings.height);
  debug.innerText = " window (" + offscreen.width + ", " + offscreen.height + ")\n"
                  + " camera (" + settings.width + ", " + settings.height + ")\n"
                  + " offset (" + offset_x + ", " + offset_y + ")\n"
                  + "\n"
                  + " orientation (" + type + ", " + angle + ")\n"
                  + "\n"
                  + document.lastModified;

  offset_x = (settings.height - offscreen.width) / 2;
  offset_y = (settings.width - offscreen.height) / 2;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    offscreen_ctx.drawImage(video, offset_x, offset_y, offscreen.width, offscreen.height, 0, 0, offscreen.width, offscreen.height);
    let src = new Image();
    let dst = new Image();

    src = offscreen_ctx.getImageData(0, 0, offscreen.width, offscreen.height);
    dst = offscreen_ctx.createImageData(offscreen.width, offscreen.height);

    for (let y = 0; y < dst.height; y++) {
        for (let x = 0; x < dst.width; x++) {
            let yy = Math.floor(y / interval) * interval;
                dst.data[(y * dst.width + x) * 4 + 0] = src.data[(yy * dst.width + x) * 4 + 0];
                dst.data[(y * dst.width + x) * 4 + 1] = src.data[(yy * dst.width + x) * 4 + 1];
                dst.data[(y * dst.width + x) * 4 + 2] = src.data[(yy * dst.width + x) * 4 + 2];
                dst.data[(y * dst.width + x) * 4 + 3] = 255;
        }
    }

    // decoded_ctx.putImageData(src, 0, 0);
    decoded_ctx.putImageData(dst, 0, 0);
  }
  requestAnimationFrame(loop);
}

function getSettings(stream) {
  let currentTrack;
  stream.getVideoTracks().forEach(track => {
      if (track.readyState == 'live') {
          currentTrack = track;
          return;
      }
  });
  settings = currentTrack.getSettings();
  console.log("settings.width: " + settings.width + "  settings.height: " + settings.height);
}

// Canvasサイズをコンテナの100%に
function setCanvasSize(theCanvas) {
  let innerW = window.innerWidth;
  let innerH = window.innerHeight;
  console.log("window.innerWidth: " + innerW + "  window.innerHeight: " + innerH);

  theCanvas.setAttribute('width', innerW);
  theCanvas.setAttribute('height', innerH);
}

function setOffscreenOffset() {
  // if (settings.width > offscreen.width) {
  //   offset_x = (settings.height - offscreen.width) / 2;
  // } else {
  //   offset_x = (offscreen.width - settings.height) / 2;
  // }
  // if (settings.height > offscreen.height) {
  //   offset_y = (settings.width - offscreen.height) / 2;
  // } else {
  //   offset_y = (offscreen.height - settings.width) / 2;
  // }
  offset_x = (settings.height - offscreen.width) / 2;
  offset_y = (settings.width - offscreen.height) / 2;
}

function reportWindowSize() {
  setCanvasSize(canvas);
  setCanvasSize(video);
  setCanvasSize(offscreen);

  setOffscreenOffset();

  // getSettings(stream);
}

setCanvasSize(canvas);
setCanvasSize(video);
setCanvasSize(offscreen);

// setOffscreenOffset();

btnInterval.addEventListener('click', function() {
  interval++;
  if (interval >= 5) {
    interval = 2;
  }

  btnInterval.innerText = interval;
});

window.onresize = reportWindowSize;


screen.orientation.addEventListener("change", function() {
  type = screen.orientation.type;
  angle = screen.orientation.angle;
});

