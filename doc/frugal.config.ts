import { cssModule } from "$dep/frugal/plugins/cssModule.ts";
import { script } from "$dep/frugal/plugins/script.ts";
import { svg } from "$dep/frugal/plugins/svg.ts";
import { googleFonts } from "$dep/frugal/plugins/googleFonts.ts";
import { Config, DenoExporter, UpstashCache } from "$dep/frugal/mod.ts";
import { docLatestRewrite } from "$dep/frugal/doc/src/middlewares/docLatestRewrite.ts";

export default {
    self: import.meta.url,
    outdir: "./dist/",
    pages: [
        "./src/pages/home/mod.ts",
        "./src/pages/doc/mod.ts",
        "./src/pages/blog/listing/mod.ts",
        "./src/pages/blog/detail/mod.ts",
    ],
    importMap: "./import_map.json",
    log: {
        level: "verbose",
    },
    plugins: [
        googleFonts(),
        cssModule(),
        svg({}),
        script(),
    ],
    esbuild: {
        //minify: true,
        jsx: "automatic",
        jsxImportSource: "preact",
        splitting: true,
    },
    budget: {
        speed: 6 * 1000 * 1000,
        delay: 1,
    },
    server: {
        port: 8000,
        middlewares: [docLatestRewrite],
    },
    globalCss: "./src/global.css",
    exporter: new DenoExporter(
        new UpstashCache(strictEnvGet("UPSTASH_URL"), strictEnvGet("UPSTASH_TOKEN")),
    ),
} satisfies Config;

function strictEnvGet(name: string) {
    const value = Deno.env.get(name);
    if (value === undefined) {
        throw Error(`Env variable "${name}" is not set.`);
    }
    return value;
}
