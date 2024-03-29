import * as esbuild from "../dep/esbuild.ts";
import * as path from "../dep/std/path.ts";

await esbuild.build({
    entryPoints: [path.fromFileUrl(new URL("../src/watch/livereload/livereload.script.ts", import.meta.url))],
    outfile: path.fromFileUrl(new URL("../src/watch/livereload/livereload.script.min.js", import.meta.url)),
    bundle: true,
    minify: true,
    target: "es6",
    define: {
        "import.meta.main": "true",
    },
    banner: {
        js: '/* this file was autogenerated from "livereload.script.ts", do not edit */',
    },
});

esbuild.stop();
