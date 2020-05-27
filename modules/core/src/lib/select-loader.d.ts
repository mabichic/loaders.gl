import {LoaderObject, LoaderContext} from './common';

/**
 * Find a loader that matches file extension and/or initial file content
 * Search the loaders array argument for a loader that matches url extension or initial data
 * Returns: a normalized loader
 * @param data data to assist
 * @param loaders
 * @param options
 * @param context context object
 */
export function selectLoader(
  data?: Response | ArrayBuffer | string,
  loaders?: LoaderObject[],
  options?: {
    nothrow?: boolean;
  },
  context?: LoaderContext | null
);
