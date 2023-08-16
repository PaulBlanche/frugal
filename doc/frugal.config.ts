import { cssModule } from "$dep/frugal/plugins/cssModule.ts";
import { script } from "$dep/frugal/plugins/script.ts";
import { svg } from "$dep/frugal/plugins/svg.ts";
import { googleFonts } from "$dep/frugal/plugins/googleFonts.ts";
import { Config, DenoExporter, UpstashCache } from "$dep/frugal/mod.ts";
import { Toc } from "./src/pages/doc/toc.ts";
import { SearchIndex } from "$dep/frugal/doc/src/search.ts";

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
        (frugal) => ({
            name: "index",
            setup(build) {
                build.onStart(async () => {
                    const toc: Toc = JSON.parse(
                        await Deno.readTextFile(new URL("./src/contents/doc/toc.json", import.meta.url)),
                    );

                    const searchIndex = new SearchIndex();

                    for (const [version, tocVersion] of Object.entries(toc)) {
                        await Promise.all(
                            tocVersion.entries
                                .filter((entry) => entry.file !== undefined)
                                .map(async (entry) => {
                                    const content = await Deno.readTextFile(
                                        new URL(`./src/contents/doc/${entry.file}`, import.meta.url),
                                    );

                                    searchIndex.add({ content, title: entry.title, slug: entry.slug, version });
                                }),
                        );
                    }

                    await Deno.writeTextFile(
                        new URL("search-index.json", frugal.config.publicdir),
                        JSON.stringify(searchIndex.serialize()),
                    );
                });
            },
        }),
    ],
    esbuild: {
        minify: true,
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
