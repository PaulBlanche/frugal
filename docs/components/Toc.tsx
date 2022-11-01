/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { cx } from '../dep/frugal/styled.ts';
import { Head, usePathname } from '../dep/frugal/preact.client.ts';
import {
    nodeFullLabel,
    nodeHref,
    nodeMatchHref,
    Toc,
    TocNode,
} from '../toc.ts';

import * as s from './Toc.style.ts';

type TocProps = {
    class?: string;
    toc: Toc;
};

export function Toc({ class: className, toc }: TocProps) {
    return (
        <nav class={cx(className, s.toc)}>
            <ol class={cx(s.tocList)}>
                {Object.values(toc.children).map((node) => {
                    return (
                        <li class={cx(s.tocItem)}>
                            <TocNode node={node} />
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

type TocNodeProps = {
    node: TocNode;
};

function TocNode({ node }: TocNodeProps) {
    const pathname = usePathname();
    return (
        <>
            {isActive() && (
                <Head>
                    <title>{nodeFullLabel(node)}</title>
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
                : (
                    <span class={cx(s.tocLink, isActive() && s.tocLinkActive)}>
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
        return nodeHref(node);
    }

    function isActive() {
        return nodeMatchHref(node, pathname);
    }
}
