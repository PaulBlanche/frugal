import * as esbuild from "../../dependencies/esbuild.js";

export type Asset = {
    entrypoint: string;
    path: string;
};

type OutputEntryPoint = Omit<esbuild.Metafile["outputs"][string], "entryPoint"> & {
    entryPoint: string;
    path: string;
};
