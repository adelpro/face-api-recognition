const video = document.getElementById("video");
const videoContainer = document.getElementById("video-container");
const logs = document.getElementById("logs");
const MODEL_URI = "/models";
log("Start loading the models");
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URI),
  faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URI),
  faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URI),
])
  .then(log("All models have been loaded."))
  .then(playVideo)
  .catch((err) => {
    console.log(err);
  });

function playVideo() {
  if (!navigator.mediaDevices) {
    console.error("mediaDevices not supported");
    return;
  }
  navigator.mediaDevices
    .getUserMedia({
      video: {
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 360, ideal: 720, max: 1080 },
      },
      audio: false,
    })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (err) {
      console.log(err);
    });
}

video.addEventListener("play", async () => {
  log("The video is starting to play.");
  log("Loading the faces from the database");
  const labeledFaceDescriptors = await loadLabeledFaceDescriptors();
  log("All faces have been loaded");
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
  // Creating the canvas
  const canvas = faceapi.createCanvasFromMedia(video);

  // This will force the use of a software (instead of hardware accelerated)
  // Enable only for low configurations
  canvas.willReadFrequently = true;

  videoContainer.appendChild(canvas);

  // Resizing the canvas to cover the video element
  const canvasSize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, canvasSize);
  log("Done.");
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();

    // Set detections size to the canvas size
    const detectionsArray = faceapi.resizeResults(detections, canvasSize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    detectionsDraw(canvas, faceMatcher, detectionsArray);
  }, 10000);
});

async function loadLabeledFaceDescriptors() {
  const faces = [
    {
      id: 1,
      label: "mahrez",
      images: ["./faces/mahrez/1.jpg", "./faces/mahrez/2.jpg"],
    },
    {
      id: 2,
      label: "mohamed",
      images: ["./faces/mohamed/1.jpg", "./faces/mohamed/2.jpg"],
    },
  ];
  const results = [];
  for (const face of faces) {
    const descriptions = [];
    for (let i = 0; i < face.images.length; i++) {
      const img = await faceapi.fetchImage(face.images[i]);
      log(`Processing image: ${face.images[i]}`);

      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detections) {
        log(`No face detected in ${face.label + ": " + face.images[i]}`);
        continue;
      }
      descriptions.push(detections.descriptor);
    }
    const result = new faceapi.LabeledFaceDescriptors(face.label, descriptions);
    results.push(result);
  }
  return results;
}
// Drawing our detections above the video
function detectionsDraw(canvas, faceMatcher, DetectionsArray) {
  DetectionsArray.forEach((detection) => {
    const faceMatches = faceMatcher.findBestMatch(detection.descriptor);
    const box = detection.detection.box;
    const drawOptions = {
      label: faceMatches.label,
      lineWidth: 2,
      boxColor: "#FF0015",
    };
    const drawBox = new faceapi.draw.DrawBox(box, drawOptions);
    drawBox.draw(canvas);
  });
}
function log(msg) {
  const message = document.createTextNode(msg);
  const li = document.createElement("li");
  li.appendChild(message);
  logs.appendChild(li);
  // Scroll down
  logs.scrollTop = logs.scrollHeight;
}
