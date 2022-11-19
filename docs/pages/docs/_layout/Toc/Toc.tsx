/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { cx } from '../../../../dep/frugal/styled.ts';
import { Head, usePathname } from '../../../../dep/frugal/preact.client.ts';
import * as hooks from 'preact/hooks';
import * as signal from 'preact/signals';

import * as toc from '../../toc.ts';
import * as s from './Toc.style.ts';
import * as svg from '../../../../svg/mod.ts';
import { NAVIGATION_CLASS } from '../../../_layout/Navigation.tsx';
import { useMatchMedia } from './useMatchMedia.ts';
import { TocToggler } from './Toggler.ts';
import { usClientSide } from './useClientSide.ts';
import { useSignal } from '../../../../hooks/useSignal.ts';

const NAV = 'navnavnav';

export type TocProps = {
    toc: toc.Toc;
    class?: string;
};

const openSignal = signal.signal(false);

const toggler = new TocToggler(openSignal, {
    target: `.${NAV}`,
    includes: `.${NAVIGATION_CLASS}`,
});

export function Toc({ toc, class: className }: TocProps) {
    const matchesSignal = useMatchMedia('(max-width: 900px)');

    const isClientSide = usClientSide();

    const open = useSignal(openSignal);
    const matches = useSignal(matchesSignal);

    signal.effect(() => {
        if (!matchesSignal.value) {
            openSignal.value = false;
        }
    });

    hooks.useEffect(() => {
        toggler.mount();
        return () => {
            toggler.unmount();
        };
    }, []);

    return (
        <nav class={cx(className, s.toc, NAV)}>
            {isClientSide && (
                <button
                    onClick={() => {
                        openSignal.value = !openSignal.value;
                    }}
                    class={cx(s.toggle)}
                >
                    <svg.Toc class={cx(s.icon)} />
                </button>
            )}
            <div
                class={cx(
                    s.drawer,
                    isClientSide && s.drawerScript,
                    matches ? open ? s.drawerOpen : s.drawerClose : false,
                )}
                //@ts-expect-error: inert does not exists in preact types
                inert={matches.value && !open}
            >
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
            <div
                class={cx(
                    s.overlay,
                    matches && open && s.overlayOpen,
                )}
                onClick={() => {
                    if (matches) {
                        openSignal.value = !openSignal.value;
                    }
                }}
            >
            </div>
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
