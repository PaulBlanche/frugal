import * as esbuild from "../../../dependencies/esbuild.js";

export type MetaFileOutput = esbuild.Metafile["outputs"][string];

export type Analysis =
    | {
          type: "page";
          entrypoint: string;
          outputPath: string;
          moduleHash: string;
      }
    | {
          type: "config";
          moduleHash: string;
      };
