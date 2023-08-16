import { clsx } from "$dep/clsx.ts";
import { usePathname } from "$dep/frugal/runtime/preact.client.ts";

import doclayout from "./DocLayout.module.css";
import * as toc from "../toc.ts";
import { Toc } from "./toc/Toc.tsx";
import { PageTocIsland } from "./PageToc.island.tsx";
import { BaseLayout, BaseLayoutProps } from "../../_layout/BaseLayout.tsx";
import { Navigation } from "../../_layout/Navigation.tsx";
import { Footer } from "../../_layout/Footer.tsx";
import { Carret } from "../../../glyphs/icons/Carret.tsx";

export type DocLayoutProps = BaseLayoutProps & {
    version: string;
    siteToc: toc.Toc;
    pageToc: { label: string; id: string; level: number }[];
};

export function DocLayout(
    { children, siteToc, pageToc, version, ...props }: DocLayoutProps,
) {
    const pathname = usePathname();

    const next = toc.nextEntry(siteToc, version, pathname);
    const previous = toc.previousEntry(siteToc, version, pathname);

    return (
        <BaseLayout {...props}>
            <Navigation />
            <div class={clsx(doclayout["wrapper"])}>
                <div>
                    <Toc toc={siteToc} version={version} />
                </div>
                <main class={clsx(doclayout["main-wrapper"])}>
                    <div class={clsx(doclayout["main"])}>
                        {children}
                        <nav class={clsx(doclayout["bottom-nav"])}>
                            {previous && (
                                <a class={clsx(doclayout["previous"])} href={toc.entryHref(previous, version)}>
                                    <Carret class={clsx(doclayout["icon"])} $type="left" />
                                    {previous.title}
                                </a>
                            )}
                            {next && (
                                <a class={clsx(doclayout["next"])} href={toc.entryHref(next, version)}>
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
