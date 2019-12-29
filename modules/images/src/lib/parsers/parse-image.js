import assert from '../utils/assert';
import {isImageTypeSupported, getDefaultImageType} from '../category-api/image-type';
import {getImageDataAsync} from '../category-api/parsed-image-api';
import parseToImage from './parse-to-image';
import parseToImageBitmap from './parse-to-image-bitmap';
import parseToNodeImage from './parse-to-node-image';

// Parse to platform defined image type (data on node, ImageBitmap or HTMLImage on browser)
// eslint-disable-next-line complexity
export default async function parseImage(arrayBuffer, options, context) {
  options = options || {};
  const imageOptions = options.image || {};

  // The user can request a specific output format via `options.image.type`
  const imageType = imageOptions.type || 'auto';

  const {url} = context || {};

  // Note: For options.image.type === `data`, we may still need to load as `image` or `imagebitmap`
  const loadType = getLoadableImageType(imageType);

  let image;
  switch (loadType) {
    case 'imagebitmap':
      image = await parseToImageBitmap(arrayBuffer, options, url);
      break;
    case 'image':
      image = await parseToImage(arrayBuffer, options, url);
      break;
    case 'data':
      // Node.js loads imagedata directly
      image = await parseToNodeImage(arrayBuffer, options);
      break;
    default:
      assert(false);
  }

  // Browser: if options.image.type === 'data', we can now extract data from the loaded image
  if (imageType === 'data') {
    const data = await getImageDataAsync(image);
    // imageBitmap has a close method to dispose of graphical resources, test if available
    if (image.close) {
      image.close();
    }
    return data;
  }

  return image;
}

// Get a loadable image type from image type
function getLoadableImageType(type) {
  switch (type) {
    case 'auto':
    case 'data':
      // Browser: For image data we need still need to load using an image format
      // Node: the default image type is `data`.
      return getDefaultImageType();
    default:
      // Throw an error if not supported
      if (!isImageTypeSupported(type)) {
        throw new Error(`@loaders.gl/images: image type ${type} not supported in this environment`);
      }
      return type;
  }
}
