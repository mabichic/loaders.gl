import {assert} from '@loaders.gl/loader-utils';
import {isLoaderObject} from './loader-utils/normalize-loader';
import {mergeOptions} from './loader-utils/merge-options';
import {getAsyncIteratorFromData} from './loader-utils/get-data';
import {getLoaderContext} from './loader-utils/get-loader-context';
import {selectLoader} from './select-loader';
import {textDecoderAsyncIterator} from '../iterator-utils/async-iteration';

export async function parseInBatches(data, loaders, options, context) {
  assert(typeof context !== 'string');
  // Signature: parseInBatches(data, options, url)
  // Uses registered loaders
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    context = null;
    options = loaders;
    loaders = null;
  }

  // Chooses a loader and normalizes it
  // TODO - only uses URL, need a selectLoader variant that peeks at first stream chunk...
  const loader = selectLoader(data, loaders, options, context);

  // Normalize options
  options = mergeOptions(loader, options);

  context = getLoaderContext({loaders}, options, context);

  return await parseWithLoaderInBatches(loader, data, options, context);
}

async function parseWithLoaderInBatches(loader, data, options, context) {
  // Create async iterator adapter for data, and concatenate result
  if (loader.parseInBatches) {
    let inputIterator = await getAsyncIteratorFromData(data);
    // Converts ArrayBuffer chunks to text chunks (leaves text chunks alone)
    if (loader.text) {
      inputIterator = textDecoderAsyncIterator(inputIterator);
    }
    const outputIterator = loader.parseInBatches(inputIterator, options, context, loader);
    return outputIterator;
  }

  throw new Error('parseWithLoaderInBatchesSync not available');
}
