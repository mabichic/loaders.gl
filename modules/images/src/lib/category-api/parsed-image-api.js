/* global document, Image, ImageBitmap, Blob, Worker, window */
export function isImage(image) {
  return Boolean(getImageTypeOrNull(image));
}

export function deleteImage(image) {
  switch (getImageType(image)) {
    case 'imagebitmap':
      image.close();
      break;
    default:
    // Nothing to do for images and image data objects
  }
}

export function getImageType(image) {
  const format = getImageTypeOrNull(image);
  if (!format) {
    throw new Error('Not an image');
  }
  return format;
}

let canvas;
let context2d;

export function getImageData(image) {
  switch (getImageType(image)) {
    case 'image':
    case 'imagebitmap':
    // @ts-ignore DEPRECATED Backwards compatibility
    case 'html': // eslint-disable-line no-fallthrough
      canvas = canvas || document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      context2d = context2d || canvas.getContext('2d');
      context2d.drawImage(image, 0, 0);
      return context2d.getImageData(0, 0, image.width, image.height);

    case 'data':
    default:
      return image;
  }
}

const WORKER_SCRIPT = `
let canvas;
let context2d;
onmessage = function(event) {
  try {
    const {image} = event.data;
    // TODO - can we reuse and resize instead of creating new canvas for each image?
    canvas = canvas || new OffscreenCanvas(image.width, image.height);
    // TODO potentially more efficient, but seems to block 2D context creation?
    // const bmContext = canvas.getContext('bitmaprenderer');
    // bmContext.transferFromImageBitmap(image);
    context2d = context2d || canvas.getContext('2d');
    context2d.drawImage(image, 0, 0);
    const imageData = context2d.getImageData(0, 0, image.width, image.height);
    const {width, height, data} = imageData;
    postMessage({type: 'done', imageData: {width, height, data: data.buffer, worker: true}}, [data.buffer]);
  } catch (error) {
    postMessage({type: 'error', message: error.message});
  }
}
`;

let cachedWorker = null;

function getWorker(script) {
  if (!cachedWorker) {
    const blob = new Blob([script]);
    // Obtain a blob URL reference to our worker 'script'.
    const blobURL = window.URL.createObjectURL(blob);
    cachedWorker = new Worker(blobURL);
  }
  return cachedWorker;
}

export async function getImageDataAsync(image) {
  if (typeof Worker !== 'undefined' && image instanceof ImageBitmap) {
    const worker = getWorker(WORKER_SCRIPT);
    return await new Promise((resolve, reject) => {
      worker.onmessage = function(event) {
        event.data.imageData.data = new Uint8Array(event.data.imageData.data);
        resolve(event.data.imageData);
      };
      worker.postMessage({type: 'decode', image}); // Start the worker.
    });
  }
  return getImageData(image);
}

// PRIVATE

// eslint-disable-next-line complexity
function getImageTypeOrNull(image) {
  if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
    return 'imagebitmap';
  }
  if (typeof Image !== 'undefined' && image instanceof Image) {
    return 'image';
  }
  if (image && typeof image === 'object' && image.data && image.width && image.height) {
    return 'data';
  }
  return null;
}
