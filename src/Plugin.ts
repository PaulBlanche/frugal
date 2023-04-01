import * as esbuild from '../dep/esbuild.ts';
import { Config } from './Config.ts';

export type Plugin = {
  name: string;
  create(build: PluginBuild): void;
};

export type RegisteredPlugin = Omit<esbuild.Plugin, 'name'> & {
  type: 'server' | 'asset';
};

export type PluginBuild = {
  config: Config;
  excludeAsset: (exclude: { type: string; filter: RegExp }) => void;
  includeAsset: (exclude: { type: string; filter: RegExp }) => void;
  register: (
    plugin: RegisteredPlugin,
  ) => void;
  onBuildAssets: (buildAssets: OnBuildAssetsCallback) => void;
};

type OnBuildAssetsArgs = {
  metafile: esbuild.Metafile;
  getAssets: (type: string) => Asset[];
  getOutputEntryPoints: () => OutputEntryPoint[];
};

export type OnBuildAssetsCallback = (
  args: OnBuildAssetsArgs,
  // deno-lint-ignore no-explicit-any
) => any | Promise<any>;

export type Asset = {
  outputEntryPoint: OutputEntryPoint;
  url: URL;
  kind: esbuild.ImportKind;
};

export type OutputEntryPoint =
  & Omit<esbuild.Metafile['outputs'][string], 'entryPoint'>
  & {
    entryPoint: string;
    path: string;
  };

export interface PluginInstance {
  name: string;
  server: esbuild.Plugin[];
  asset: esbuild.Plugin[];
  buildAssets?: OnBuildAssetsCallback;
}
