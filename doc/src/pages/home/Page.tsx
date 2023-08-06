import { PageProps } from "$dep/frugal/runtime/preact.server.ts";
import { clsx } from "$dep/frugal/doc/dep/clsx.ts";

import page from "./Page.module.css";
import link from "../../styles/link.module.css";
import { Hero } from "./Hero.tsx";
import { LandingLayout } from "../../layouts/landing/LandingLayout.tsx";
import { Code } from "../../components/code/Code.tsx";

import versions from "../../../../versions.json" assert { type: "json" };
import { CounterIsland } from "$dep/frugal/doc/src/pages/home/CounterIsland.tsx";

export function Page(props: PageProps) {
    return (
        <LandingLayout {...props}>
            <Hero />

            <div class={clsx(page["entry"])}>
                <h2 class={clsx(page["title"])}>Static by default</h2>

                <div class={page["description"]}>
                    <p>
                        By default Frugal only produces static html at build time, working{" "}
                        <strong>like a static site generator</strong>.
                    </p>
                    <p>
                        Each static page will be rebuilt only if the underlying data or code changed. If you use Frugal
                        as a server, static page can also be{" "}
                        <strong>
                            generated <em>just in time</em>
                        </strong>{" "}
                        (on the first request), or <strong>regenerated via webhook</strong>.
                    </p>
                    <p>
                        With a good content strategy you don't need to redeploy when your content changes
                    </p>
                </div>

                <Code
                    class={clsx(page["code"])}
                    files={[{
                        filename: "static-page.ts",
                        language: "ts",
                        code: `import { DataResponse } from "http://deno.land/x/frugal@${versions[0]}/page.ts"
                        
export const pattern = '/';

export function generate() {
    return new DataResponse({
        data: {
            hello: 'world'
        }
    });
}

export function render({ data }) {
    return \`<html>
        <body>
            <h1>Hello \${data.hello} !</h1>
        </body>
    </html>\`;
}
`,
                    }]}
                />
            </div>

            <div class={clsx(page["entry"])}>
                <h2 class={clsx(page["title"])}>Server side rendering when needed</h2>

                <div class={page["description"]}>
                    <p>
                        Frugal comes with a server that can render{" "}
                        <strong>dynamic pages at request time</strong>. Pages can answer to GET, POST, PUT and DELETE
                        with fully controlable responses (status and headers).
                    </p>
                </div>

                <Code
                    class={clsx(page["code"])}
                    files={[{
                        filename: "dynamic-page.ts",
                        language: "ts",
                        code: `import { DataResponse } from "http://deno.land/x/frugal@${versions[0]}/page.ts"
                        
export const pattern = '/:id';
    
export const type = 'dynamic'

export async function GET({ path }) {
    return new DataResponse({
        data: {
            post: await getPostById(path.id)
        }
    });
}

export function render({ data }) {
    return \`<html>
        <body>
            <h1>\${data.post.title}</h1>
            \${data.post.content}
        </body>
    </html>\`;
}
`,
                    }]}
                />
            </div>

            <div class={clsx(page["entry"])}>
                <h2 class={clsx(page["title"])}>
                    Progressive enhancement via <em>scripts</em>
                </h2>

                <div class={page["description"]}>
                    <p>
                        Any module declared as <em>script</em> will be{" "}
                        <strong>bundled and executed in the browser</strong>, allowing you to add interactivity to your
                        pages where you need it.
                    </p>
                    <p>
                        Clients that can run those scripts will get an{" "}
                        <strong>enhanced experience</strong>, those that can't will get a functional html page.
                    </p>
                    <p>
                        Those "scripts" are the building blocks for island hydration if you use a client-side UI
                        framework.
                    </p>
                </div>

                <Code
                    class={clsx(page["code"])}
                    files={[{
                        filename: "page.ts",
                        language: "ts",
                        code: `import { DataResponse } from "http://deno.land/x/frugal@${versions[0]}/page.ts"
import './log.script.ts'
                        
export const pattern = '/';

export function generate() {
    return new DataResponse({
        data: {
            hello: 'world'
        }
    });
}

export function render({ data }) {
    return \`<html>
        <body>
            <h1>Hello \${data.hello} !</h1>
        </body>
    </html>\`;
}
`,
                    }, {
                        filename: "log.script.ts",
                        language: "ts",
                        code: `if (import.meta.main) {
    console.log('Hello world')
}
`,
                    }]}
                />
            </div>

            <div class={clsx(page["entry"])}>
                <h2 class={clsx(page["title"])}>Island hydration</h2>

                <div class={page["description"]}>
                    <p>
                        Based on <em>scripts</em>, Frugal implements an integration with{" "}
                        <a class={clsx(link["link"])} href="https://preactjs.com/">Preact</a> and{" "}
                        <a class={clsx(link["link"])} href="https://svelte.dev/">Svelte</a>. You can describe the whole
                        UI with thoses framework, and optionnaly declare <strong>island of interactivity</strong>{" "}
                        that will be bundled, served and <strong>hydrated on the client</strong>.
                    </p>
                    <p>
                        If you want to use another UI framework, integrations with Frugal via <em>scripts</em>{" "}
                        should be easy to write.
                    </p>
                    <CounterIsland initialValue={5} />
                </div>

                <Code
                    class={clsx(page["code"])}
                    files={[
                        {
                            filename: "page.ts",
                            language: "ts",
                            code: `import { DataResponse } from "http://deno.land/x/frugal@${versions[0]}/page.ts"
import { getRenderFrom } from "http://deno.land/x/frugal@${versions[0]}/runtime/preact.server.ts"
import { Page } from "./Page.tsx";

export const pattern = '/';

export function generate() {
    return new DataResponse({
        data: {
            hello: 'world'
        }
    });
}

export const render = getRenderFrom(Page)
`,
                        },
                        {
                            filename: "Page.tsx",
                            language: "tsx",
                            code: `import { PageProps, Head, useData } from "http://deno.land/x/frugal@${
                                versions[0]
                            }/runtime/preact.server.ts";
import { CounterIsland } from './CounterIsland.tsx'

function Page(pageProps: PageProps) {
    const scriptSrc = assets["script"]?.[descriptor];
    const data = useData();
    return <>
        <Head>
            {scriptSrc && <script type="module" src={scriptSrc}></script>}
        </Head>
        <h1>Hello {data.hello}</h1>
        <CounterIsland />
    </>
}
`,
                        },
                        {
                            filename: "CounterIsland.tsx",
                            language: "tsx",
                            code: `import { Island } from "http://deno.land/x/frugal@${
                                versions[0]
                            }/runtime/preact.client.ts";

import { NAME } from "./CounterIsland.script.ts";
import { Counter } from "./Counter.tsx";

export function CounterIsland() {
    return <Island name={NAME} Component={Counter} />;
}
`,
                        },
                        {
                            filename: "Counter.tsx",
                            language: "tsx",
                            code: `import { signal } from "npm:@preact/signals";

const count = signal(0);

export function Counter() {
    return <div>
        <button onClick={() => count.value = Math.max(0, count.value - 1)}>
            decrement
        </button>

        <span>count: {count}</span>

        <button onClick={() => count.value += 1}>
            increment
        </button>
    </div>
}


`,
                        },
                        {
                            filename: "CounterIsland.script.ts",
                            language: "ts",
                            code: `import { hydrate } from "http://deno.land/x/frugal@${
                                versions[0]
                            }/runtime/preact.client.ts";
import { Counter } from "./Counter.tsx";

export const NAME = "Counter";

if (import.meta.main) {
    hydrate(NAME, () => Counter);
}                        
`,
                        },
                    ]}
                />
            </div>
        </LandingLayout>
    );
}
