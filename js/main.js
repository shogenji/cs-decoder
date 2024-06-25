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

let debugText = "\n";

const constraints = {
  video: {
    width: {min: 640, ideal: 1080, max: 1920},
    height: {min: 640, ideal: 1080, max: 1920},
    aspectRatio: {exact: 1.0},
    frameRate: {max: 30},
    facingMode: {exact: 'environment'},
  }
};


function handleSuccess(stream) {
  window.stream = stream; // make stream available to browser console
  video.srcObject = stream;
  video.play();

  getSettings(stream);
  video.width = settings.width;
  video.height = settings.height;

  requestAnimationFrame(loop);
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);

function loop() {
  drawDebugText();

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    // offscreen.width = video.width;
    // offscreen.height = video.height;
    setOffscreenSize();
    offscreen_ctx.drawImage(video, 0, 0);
    // offscreen_ctx.drawImage(video, offset_x, offset_y, offscreen.width, offscreen.height, 0, 0, offscreen.width, offscreen.height);
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

    // decoded_ctx.drawImage(dst, 0, 0);
    decoded_ctx.putImageData(dst, 0, 0);
    // decoded_ctx.putImageData(dst, 0, 0, 0, 0, offscreen.height * (canvas.height / canvas.width), offscreen.height);
    // decoded_ctx.putImageData(dst, 0, 0, 0, 0, canvas.width, canvas.height);
 
    // const bigCanvas = document.getElementById("big");
    // const bigContext = bigCanvas.getContext("2d");        
    // const smallContext = document.getElementById("small").getContext("2d");         
    // smallContext.scale(0.5, 0.5);
    // smallContext.drawImage(bigCanvas, 0, 0);        
    // const smallImageData = smallContext.getImageData(0, 0, bigCanvas.width, bigCanvas.height);
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
  // console.log("settings.width: " + settings.width + "  settings.height: " + settings.height);
}

// Canvasサイズをコンテナの100%に
function setCanvasSize(theCanvas) {
  let innerW = window.innerWidth;
  let innerH = window.innerHeight;
  // console.log("window.innerWidth: " + innerW + "  window.innerHeight: " + innerH);

  theCanvas.setAttribute('width', innerW);
  theCanvas.setAttribute('height', innerH);
}

function setOffscreenSize() {
  if (window.innerWidth < window.innerHeight) {
    offscreen.width = video.width * (window.innerWidth / window.innerHeight);
    offscreen.height = video.width;
  } else {
    offscreen.width = video.width;
    offscreen.height = video.width * (window.innerWidth / window.innerHeight);
  }
}


function setOffscreenOffset() {
  if (settings.width > settings.height) {
    switch (screen.orientation.type) {
      case "landscape-primary":
      case "landscape-secondary":
        offset_x = (settings.width - offscreen.width) / 2;
        offset_y = (settings.height - offscreen.height) / 2;
        break;
      case "portrait-secondary":
      case "portrait-primary":
        offset_x = (settings.height - offscreen.width) / 2;
        offset_y = (settings.width - offscreen.height) / 2;
        break;
      default:
    }
  } else {
    switch (screen.orientation.type) {
      case "landscape-primary":
      case "landscape-secondary":
        offset_x = (settings.height - offscreen.width) / 2;
        offset_y = (settings.width - offscreen.height) / 2;
        break;
      case "portrait-secondary":
      case "portrait-primary":
        offset_x = (settings.width - offscreen.width) / 2;
        offset_y = (settings.height - offscreen.height) / 2;
        break;
      default:
    }
  }
}

function windowResized() {
  setCanvasSize(canvas);
  // setCanvasSize(video);
  //setCanvasSize(offscreen);
}

setCanvasSize(canvas);
// setCanvasSize(video);
//setCanvasSize(offscreen);

// setOffscreenOffset();

btnInterval.addEventListener('click', function() {
  debugText = "button clicked!\n";

  interval++;
  if (interval > 9) {
    interval = 1;
  }

  btnInterval.innerText = interval;
});

window.onresize = windowResized;

screen.orientation.addEventListener("change", function() {
  debugText = "orientation changed!\n";

  type = screen.orientation.type;
  angle = screen.orientation.angle;

  setOffscreenOffset();
});


function drawDebugText() {
  // console.log("settings.width: " + settings.width + "  settings.height: " + settings.height);
  debug.innerText = " window (" + window.innerWidth + ", " + window.innerHeight + ")\n"
                  + " camera (" + settings.width + ", " + settings.height + ")\n"
                  + " video (" + video.width + ", " + video.height + ")\n"
                  + " canvas (" + canvas.width + ", " + canvas.height + ")\n"
                  + " offscreen (" + offscreen.width + ", " + offscreen.height + ")\n"
                  + "\n"
                  + " offset (" + offset_x + ", " + offset_y + ")\n"
                  + "\n"
                  + " orientation (" + type + ", " + angle + ")\n"
                  + "\n"
                  + debugText
                  + "\n"
                  + document.lastModified;
}