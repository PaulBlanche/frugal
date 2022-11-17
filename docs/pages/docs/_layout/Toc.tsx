/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { cx } from '../../../dep/frugal/styled.ts';
import { Head, usePathname } from '../../../dep/frugal/preact.client.ts';

import * as toc from '../toc.ts';
import * as s from './Toc.style.ts';
import {
    DRAWER_CLASSNAME,
    MobileToggle,
    OVERLAY_CLASSNAME,
} from './MobileToggle.island.tsx';

export type TocProps = {
    toc: toc.Toc;
    class?: string;
};

export function Toc({ toc, class: className }: TocProps) {
    return (
        <nav class={cx(className, s.toc)}>
            <MobileToggle />
            <div class={cx(DRAWER_CLASSNAME, s.drawer, s.drawerScript)}>
                <ol class={cx(s.tocList)}>
                    {Object.values(toc.children).map((node) => {
                        return (
                            <li class={cx(s.tocItem)}>
                                <TocNode node={node} />
                            </li>
                        );
                    })}
                </ol>
            </div>
            <noscript>
                <div class={cx(DRAWER_CLASSNAME, s.drawer)}>
                    <ol class={cx(s.tocList)}>
                        {Object.values(toc.children).map((node) => {
                            return (
                                <li class={cx(s.tocItem)}>
                                    <TocNode node={node} />
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </noscript>
            <div class={cx(s.overlay, OVERLAY_CLASSNAME)}></div>
        </nav>
    );
}

type TocNodeProps = {
    node: toc.TocNode;
};

function TocNode({ node }: TocNodeProps) {
    const pathname = usePathname();
    return (
        <>
            {isActive() && (
                <Head>
                    <title>{toc.nodeFullLabel(node)}</title>
                </Head>
            )}
            {node.slug && !isActive()
                ? (
                    <a
                        class={cx(s.tocLink, isActive() && s.tocLinkActive)}
                        href={href()}
                    >
                        {node.name}
                    </a>
                )
                : node.slug
                ? (
                    <span class={cx(s.tocLink, isActive() && s.tocLinkActive)}>
                        {node.name}
                    </span>
                )
                : (
                    <span>
                        {node.name}
                    </span>
                )}

            {node.children && (
                <ol class={cx(s.tocList)}>
                    {node.children.map((node) => {
                        return (
                            <li class={cx(s.tocItem)}>
                                <TocNode node={node} />
                            </li>
                        );
                    })}
                </ol>
            )}
        </>
    );

    function href() {
        return toc.nodeHref(node);
    }

    function isActive() {
        return toc.nodeMatchHref(node, pathname);
    }
}
