import { Config } from "./config.ts";
import { CacheType, ExportType, Framework, jsxConfig } from "./types.ts";

export function denoConfig({ framework }: Config) {
    return JSON.stringify(
        {
            compilerOptions: jsxConfig(framework)?.deno,
            importMap: "./import_map.json",
            tasks: {
                build: "deno run -A build.ts",
                watch: "deno run -A watch.ts",
            },
        },
        null,
        2,
    );
}

const FRUGAL_VERSION = "0.9.0";

const PREACT_VERSION = "10.13.1";
const PREACT_SIGNAL_VERSION = "1.1.5";
const PREACT_RENDER_VERSION = "5.2.6";

const SVELTE_VERSION = "3.58.0";

export function importMap({ framework }: Config) {
    const imports: Record<string, string> = {
        "frugal/": `https://deno.land/x/frugal@${FRUGAL_VERSION}/`,
    };

    switch (framework) {
        case Framework.PREACT: {
            imports["preact"] = `https://esm.sh/preact@${PREACT_VERSION}`;
            imports["preact/"] = `https://esm.sh/preact@${PREACT_VERSION}/`;
            imports["@preact/signals"] = `https://esm.sh/@preact/signals@${PREACT_SIGNAL_VERSION}?external=preact`;
            imports["preact-render-to-string"] =
                `https://esm.sh/*preact-render-to-string@${PREACT_RENDER_VERSION}?external=preact`;
            break;
        }
        case Framework.SVELTE: {
            imports["svelte"] = `npm:/svelte@${SVELTE_VERSION}`;
            imports["svelte/"] = `npm:/svelte@${SVELTE_VERSION}/`;
        }
    }

    return JSON.stringify({ imports }, null, 2);
}

export function frugalConfig({ exportType, cacheType, framework }: Config) {
    const imports = ["Config"];
    let cache = undefined;

    switch (exportType) {
        case ExportType.NGINX: {
            imports.push("NginxExporter");
            break;
        }
        case ExportType.DENO: {
            imports.push("DenoExporter");
            break;
        }
    }

    switch (cacheType) {
        case CacheType.DENO_KV: {
            cache = "DenoKvCacheStorage";
            imports.push("DenoKvCacheStorage");
        }
    }

    const config = [`import { ${imports.join(", ")} } from 'frugal/mod.ts';
   
export default {
    self: import.meta.url,
    pages: ["./pages/hello-world.ts"],
    importMap: './import_map.json',`];

    switch (exportType) {
        case ExportType.NGINX: {
            config.push("    export: new NginxExporter(),");
            break;
        }
        case ExportType.DENO: {
            config.push(`    export: new DenoExporter(${cache}),`);
            break;
        }
    }

    const esbuildJsx = jsxConfig(framework)?.esbuild;
    if (esbuildJsx) {
        config.push(`    esbuild: {
        jsx: "${esbuildJsx.jsx}",
        jsxImportSource: "${esbuildJsx.jsxImportSource}",
    },`);
    }

    config.push("} satisfies Config");

    return config.join("\n");
}

export function helloWorldPage({ framework }: Config): { path: string; content: string }[] {
    switch (framework) {
        case Framework.NO_FRAMEWORK: {
            return [{
                path: "pages/hello-world.ts",
                content: ` import { DataResponse, RenderContext } from "frugal/page.ts";

export const pattern = "/";

type Data = { content: string }

export function generate() {
    return new DataResponse({ data: { content: 'world' }})
}

export function render({ data }: RenderContext<typeof pattern, Data>) {
    return "<html><body><h1>Hello \${data.content}</h1></body></html>"
}
`,
            }];
        }
        case Framework.PREACT: {
            return [{
                path: "pages/HelloWorldPage.tsx",
                content: `import { useData } from "frugal/runtime/preact.client.ts";

export function HelloWorldPage() {
    const data = useData<{ content: string }>();
    
    return <h1>Hello {data.content}</h1>
}                
`,
            }, {
                path: "pages/hello-world.ts",
                content: `import { DataResponse } from "frugal/page.ts";
import { getRenderFrom } from "frugal/runtime/preact.server.ts";
import { HelloWorldPage } from "./HelloWorldPage.tsx";

export const pattern = '/';

export function generate() {
    return new DataResponse({ data: { content: 'world' }})
}

export const render = getRenderFrom(HelloWorldPage)
`,
            }];
        }
        case Framework.SVELTE: {
            return [{
                path: "pages/HelloWorldPage.svelte",
                content: `<script>
    import { getData } from "frugal/runtime/svelte.client.ts";

    const data = getData();
</script>

<h1>Hello {data.content}</h1>
`,
            }, {
                path: "pages/hello-world.ts",
                content: `import { DataResponse } from "frugal/page.ts";
import { getRenderFrom } from "frugal/runtime/svelte.server.ts";
import HelloWorldPage from "./HelloWorldPage.svelte";

export const pattern = '/';

export function generate() {
    return new DataResponse({ data: { content: 'world' }})
}

export const render = getRenderFrom(HelloWorldPage)
`,
            }];
        }
    }
}

export function watchScript() {
    return `import { context } from "frugal/mod.ts";

// load some env variable here, before loading the configuration

const { default: config } = await import("./frugal.config.ts")

await context(config).watch();    
`;
}

export function buildScript() {
    return `import { build } from "frugal/mod.ts";

// load some env variable here, before loading the configuration

const { default: config } = await import("./frugal.config.ts")

await build(config);    
`;
}
