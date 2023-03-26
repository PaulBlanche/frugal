/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { clsx } from "$dep/clsx.ts";
import { PageProps } from "$dep/frugal/runtime/preact.server.ts";

import { BaseLayout } from "../../layouts/BaseLayout/mod.ts";
import { HeroHeader } from "./HeroHeader.tsx";
// @deno-types="frugal/css-module.d.ts"
import page from "./Page.module.css";
// @deno-types="frugal/css-module.d.ts"
import link from "../../styles/link.module.css";
// @deno-types="frugal/svg.d.ts"
import islandSvg from "../../glyphs/illustrations/island.svg";
// @deno-types="frugal/svg.d.ts"
import staticSvg from "../../glyphs/illustrations/static.svg";
// @deno-types="frugal/svg.d.ts"
import serverSvg from "../../glyphs/illustrations/server.svg";
// @deno-types="frugal/svg.d.ts"
import frameworkSvg from "../../glyphs/illustrations/framework.svg";
// @deno-types="frugal/svg.d.ts"
import incrementalSvg from "../../glyphs/illustrations/incremental.svg";
// @deno-types="frugal/svg.d.ts"
import mpaSvg from "../../glyphs/illustrations/mpa.svg";

export function Page(props: PageProps) {
  return (
    <BaseLayout {...props}>
      <HeroHeader />
      <main class={page["main-container"]}>
        <div class={page["entry"]}>
          <svg class={page["illustration"]}>
            <use href={staticSvg} />
          </svg>
          <h2 class={page["title"]}>Static by default</h2>
          <p class={page["text"]}>
            By default Frugal only produces static html at build time, working
            like a static site generator. Even if you use a client-side UI
            framework like{" "}
            <a
              class={clsx(link["link"])}
              href="https://preactjs.com/"
            >
              Preact
            </a>, by default frugal will only generate plain old boring html.
          </p>
        </div>

        <div class={page["entry"]}>
          <svg class={page["illustration"]}>
            <use href={serverSvg} />
          </svg>
          <h2 class={page["title"]}>Server side pages render</h2>
          <p class={page["text"]}>
            Frugal comes with a server that can render dynamic pages at request
            time. Pages can answer to GET, POST, PUT and DELETE with fully
            controlable response (status and headers)
          </p>
        </div>

        <div class={page["entry"]}>
          <svg class={page["illustration"]}>
            <use href={islandSvg} />
          </svg>
          <h2 class={page["title"]}>Interactive client-side islands</h2>
          <p class={page["text"]}>
            If you declare islands of interactivity with client-side UI
            framework, Frugal will bundle the js necessary to hydrate them while
            still rendering the static html of those islands. Clients that can
            run those bundle get an enhanced experience, others still get a
            functional html page.
          </p>
        </div>

        <div class={page["entry"]}>
          <svg class={page["illustration"]}>
            <use href={frameworkSvg} />
          </svg>
          <h2 class={page["title"]}>Bring your own framework</h2>
          <p class={page["text"]}>
            Frugal works with any UI framework able to compile to html for
            static content. You can declare islands of interactivity with{" "}
            <a
              class={clsx(link["link"])}
              href="https://preactjs.com/"
            >
              Preact
            </a>,{" "}
            <a
              class={clsx(link["link"])}
              href="https://svelte.dev/"
            >
              Svelte
            </a>{" "}
            or{" "}
            <a
              class={clsx(link["link"])}
              href="https://vuejs.org/"
            >
              Vue
            </a>
          </p>
        </div>

        <div class={page["entry"]}>
          <svg class={page["illustration"]}>
            <use href={incrementalSvg} />
          </svg>
          <h2 class={page["title"]}>Incremental build</h2>
          <p class={page["text"]}>
            As long as you persist some cache data, Frugal will ever rebuild
            pages on two conditions : either the data or the code for the page
            has changed since the last build
          </p>
        </div>

        <div class={page["entry"]}>
          <svg class={page["illustration"]}>
            <use href={mpaSvg} />
          </svg>
          <h2 class={page["title"]}>Client session</h2>
          <p class={page["text"]}>
            Instead of building a SPA and having to send the whole application
            to the client, reimplement routing, caching, etc... with Frugal and
            client session you build a MPA and you get an SPA experience : the
            client js context is persisted between pages.
          </p>
        </div>
      </main>
    </BaseLayout>
  );
}
