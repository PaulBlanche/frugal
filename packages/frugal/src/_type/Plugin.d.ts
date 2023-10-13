import * as esbuild from "../../dependencies/esbuild.js";
import { AssetType } from "../page/Assets.js";
import { Context } from "../Plugin.js";

export type Output = (type: string, asset: AssetType) => void;

export type Plugin = (context: Context) => esbuild.Plugin;
