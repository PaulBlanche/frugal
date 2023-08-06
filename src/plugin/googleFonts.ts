import * as path from "../../dep/std/path.ts";
import * as fs from "../../dep/std/fs.ts";
import * as streams from "../../dep/std/streams.ts";
import * as xxhash from "../../dep/xxhash.ts";

import { Plugin } from "../Plugin.ts";

export function googleFonts(): Plugin {
    return (frugal) => {
        return {
            name: "frugal:cssModule",
            setup(build) {
                build.onResolve({ filter: /^\/\/fonts.googleapis.com\//, namespace: "https" }, async (args) => {
                    const name = (await xxhash.create()).update(args.path).digest("hex").toString();
                    return {
                        path: `/googlefonts-${name}.css`,
                        namespace: "virtual",
                        pluginData: { url: frugal.url(args).href },
                    };
                });

                build.onResolve({ filter: /^\/fonts\/.*$/ }, () => {
                    return { external: true };
                });

                build.onLoad({ filter: /^\/googlefonts-.*\.css$/, namespace: "virtual" }, async (args) => {
                    const url = args.pluginData.url;
                    if (!url) {
                        return;
                    }

                    const response = await fetch(url);
                    let css = await response.text();
                    const urls = css.match(/src\s*:\s*url\((.*?)\)/g);

                    if (urls) {
                        for (const url of urls) {
                            const matched = url.match(/src\s*:\s*url\((.*?)\)/);
                            if (matched) {
                                const response = await fetch(matched[1]);
                                const readableStream = response.body?.getReader();
                                if (readableStream) {
                                    const reader = streams.readerFromStreamReader(readableStream);
                                    const name = (await xxhash.create()).update(matched[1]).digest("hex").toString();
                                    const ext = path.extname(matched[1]);

                                    const fontPath = `fonts/${name}${ext}`;
                                    const fontUrl = new URL(fontPath, frugal.config.publicdir);

                                    await fs.ensureFile(fontUrl);
                                    const file = await Deno.open(fontUrl, { create: true, write: true });
                                    try {
                                        await streams.copy(reader, file);
                                        css = css.replace(matched[1], `/fonts/${name}${ext}`);
                                    } finally {
                                        file.close();
                                    }
                                }
                            }
                        }
                    }

                    return { contents: css, loader: "css" };
                });
            },
        };
    };
}
