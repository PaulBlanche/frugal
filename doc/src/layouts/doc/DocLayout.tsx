import { clsx } from "$dep/clsx.ts";
import { usePathname } from "$dep/frugal/runtime/preact.client.ts";

import doclayout from "./DocLayout.module.css";
import * as toc from "../../toc.ts";
import { Toc } from "./toc/Toc.tsx";
import { PageTocIsland } from "./PageToc.island.tsx";
import { BaseLayout, BaseLayoutProps } from "../base/BaseLayout.tsx";
import { Navigation } from "../landing/Navigation.tsx";
import { Footer } from "../landing/Footer.tsx";
import { Carret } from "$dep/frugal/doc/src/glyphs/icons/Carret.tsx";

export type DocLayoutProps = BaseLayoutProps & {
    siteToc: toc.Toc;
    pageToc: { label: string; id: string }[];
};

export function DocLayout(
    { children, siteToc, pageToc, ...props }: DocLayoutProps,
) {
    const pathname = usePathname();

    const next = toc.nextEntry(siteToc, pathname);
    const previous = toc.previousEntry(siteToc, pathname);

    return (
        <BaseLayout {...props}>
            <Navigation />
            <div class={clsx(doclayout["wrapper"])}>
                <div>
                    <Toc toc={siteToc} class={clsx(doclayout["site-nav"])} />
                </div>
                <main class={clsx(doclayout["main-wrapper"])}>
                    <div class={clsx(doclayout["main"])}>
                        {children}
                        <nav class={clsx(doclayout["bottom-nav"])}>
                            {previous && (
                                <a class={clsx(doclayout["previous"])} href={toc.entryHref(previous)}>
                                    <Carret class={clsx(doclayout["icon"])} $type="left" />
                                    {previous.title}
                                </a>
                            )}
                            {next && (
                                <a class={clsx(doclayout["next"])} href={toc.entryHref(next)}>
                                    {next.title}
                                    <Carret class={clsx(doclayout["icon"])} $type="right" />
                                </a>
                            )}
                        </nav>
                    </div>
                    <aside class={clsx(doclayout["aside"])}>
                        <div class={clsx(doclayout["page-nav"])}>
                            <PageTocIsland pageToc={pageToc} />
                        </div>
                    </aside>
                    <Footer class={clsx(doclayout["footer"])} />
                </main>
            </div>
        </BaseLayout>
    );
}
