import * as esbuild from '../../dep/esbuild.ts';

import * as deno from './deno.ts';

export type Loaded = Omit<esbuild.OnLoadResult, 'contents'> & {
  contents: string | Uint8Array;
};

export interface Loader {
  resolve(specifier: URL): Promise<LoaderResolution>;
  loadEsm(specifier: string): Promise<Loaded>;
}
export type LoaderResolution =
  | LoaderResolutionEsm
  | LoaderResolutionNpm
  | LoaderResolutionNode;

export interface LoaderResolutionEsm {
  kind: 'esm';
  specifier: URL;
}

export interface LoaderResolutionNpm {
  kind: 'npm';
  packageName: string;
  path: string;
}

export interface LoaderResolutionNode {
  kind: 'node';
  path: string;
}

export interface LoaderOptions {
  importMapURL?: URL;
}

export interface NpmSpecifier {
  name: string;
  version: string | null;
  path: string | null;
}

export interface NpmSpecifier {
  name: string;
  version: string | null;
  path: string | null;
}

export function parseNpmSpecifier(specifier: URL): NpmSpecifier {
  if (specifier.protocol !== 'npm:') throw new Error('Invalid npm specifier');
  const path = specifier.pathname;
  const startIndex = path[0] === '/' ? 1 : 0;
  let pathStartIndex;
  let versionStartIndex;
  if (path[startIndex] === '@') {
    const firstSlash = path.indexOf('/', startIndex);
    if (firstSlash === -1) {
      throw new Error(`Invalid npm specifier: ${specifier}`);
    }
    pathStartIndex = path.indexOf('/', firstSlash + 1);
    versionStartIndex = path.indexOf('@', firstSlash + 1);
  } else {
    pathStartIndex = path.indexOf('/', startIndex);
    versionStartIndex = path.indexOf('@', startIndex);
  }

  if (pathStartIndex === -1) pathStartIndex = path.length;
  if (versionStartIndex === -1) versionStartIndex = path.length;

  if (versionStartIndex > pathStartIndex) {
    versionStartIndex = pathStartIndex;
  }

  if (startIndex === versionStartIndex) {
    throw new Error(`Invalid npm specifier: ${specifier}`);
  }

  return {
    name: path.slice(startIndex, versionStartIndex),
    version: versionStartIndex === pathStartIndex
      ? null
      : path.slice(versionStartIndex + 1, pathStartIndex),
    path: pathStartIndex === path.length ? null : path.slice(pathStartIndex),
  };
}

export function mediaTypeToLoader(
  mediaType: deno.MediaType,
): esbuild.Loader | undefined {
  switch (mediaType) {
    case 'JavaScript':
    case 'Mjs':
      return 'js';
    case 'JSX':
      return 'jsx';
    case 'TypeScript':
    case 'Mts':
      return 'ts';
    case 'TSX':
      return 'tsx';
    case 'Json':
      return 'js';
    default:
      return undefined;
  }
}

export function transformRawIntoContent(
  raw: Uint8Array,
  mediaType: deno.MediaType,
): string | Uint8Array {
  switch (mediaType) {
    case 'Json':
      return jsonToESM(raw);
    default:
      return raw;
  }
}

function jsonToESM(source: Uint8Array): string {
  const sourceString = new TextDecoder().decode(source);
  let json = JSON.stringify(JSON.parse(sourceString), null, 2);
  json = json.replaceAll(`"__proto__":`, `["__proto__"]:`);
  return `export default ${json};`;
}
