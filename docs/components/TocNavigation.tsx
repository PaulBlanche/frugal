/** @jsxImportSource preact */
import { cx } from '../dep/frugal/styled.ts';
import {
    flattenToc,
    FlatTocNode,
    nodeFullLabel,
    nodeHref,
    nodeMatchHref,
    Toc,
} from '../toc.ts';
import { usePathname } from '../dep/frugal/frugal_preact.server.ts';
import { Carret } from '../svg/Carret.svg.tsx';

import * as s from './TocNavigation.style.ts';

type TocNavigationProps = {
    toc: Toc;
};

export function TocNavigation({ toc }: TocNavigationProps) {
    const pathname = usePathname();

    const flatToc = flattenToc(toc);
    console.log(flatToc);
    const currentNodeIndex = flatToc.findIndex((node) =>
        nodeMatchHref(node, pathname)
    );

    const previousNode = currentNodeIndex - 1 >= 0
        ? flatToc[currentNodeIndex - 1]
        : undefined;

    const nextNode = currentNodeIndex + 1 < flatToc.length
        ? flatToc[currentNodeIndex + 1]
        : undefined;

    return (
        <nav class={cx(s.tocNavigation)}>
            {previousNode && (
                <TocNavigationLink type='previous' node={previousNode} />
            )}
            {nextNode && <TocNavigationLink type='next' node={nextNode} />}
        </nav>
    );
}

type TocNavigationLinkProps = {
    type: 'previous' | 'next';
    node: FlatTocNode;
};

function TocNavigationLink({ type, node }: TocNavigationLinkProps) {
    return (
        <a
            class={cx(s.tocLink, type === 'next' ? s.linkNext : s.linkPrevious)}
            href={nodeHref(node)}
        >
            {type === 'previous' && <Carret class={cx(s.carret)} />}
            {nodeFullLabel(node)}
            {type === 'next' && <Carret class={cx(s.carret)} />}
        </a>
    );
}
