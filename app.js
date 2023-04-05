const video = document.getElementById("video");
const videoContainer = document.getElementById("video-container");
const MODEL_URI = "/models";
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URI),
  faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URI),
  faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URI),
])
  .then(playVideo)
  .then(faceRecognition)
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
const loadFacesDescpritions = async () => {
  const labesl = ["adel"];
  faces.forEach(async (label) => {
    const descriptions = [];
    for (i = 1; i <= 2; i++) {
      const image = await faceapi.fetchImage(`./faces/${face}/${i}.png`);
      const detections = await faceapi
        .detectSingleFace(image)
        .withFaceLandmarks()
        .withFaceDescriptor();
      descriptions.push(detections.descriptor);
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    }
  });
};

const faceRecognition = async () => {
  const labeledFaceDescriptors = await loadFacesDescpritions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
  video.addEventListener("play", () => {
    // Creating the canvas
    const canvas = faceapi.createCanvasFromMedia(video);

    // This will force the use of a software (instead of hardware accelerated)
    // Enable only for low configurations
    canvas.willReadFrequently = true;
    videoContainer.appendChild(canvas);

    // Resizing the canvas to cover the video element
    const canvasSize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, canvasSize);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video)
        .withFaceLandmarks()
        .withfaceDescriptor();

      // Set detections size to the canvas size
      const detectionsArray = faceapi.resizeResults(detections, canvasSize);
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      detectionsDraw(canvas, detectionsArray);
    }, 100);
  });
};

// Drawing our detections above the video
function detectionsDraw(canvas, DetectionsArray) {
  DetectionsArray.forEach((face) => {
    const box = faceMatcher.findBestMatch(face.descriptor);
    const drawBox = new faceapi.draw.DrawBox(box, { label, face });
    drawBox.draw(canvas);
  });
}
