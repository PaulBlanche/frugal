/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { cx } from '../../dep/frugal/styled.ts';

import * as toc from '../../toc.ts';
import { BaseLayout } from '../BaseLayout/mod.tsx';
import { MAIN_CLASSNAME } from './MobileToggle.tsx';

import * as s from './mod.style.ts';
import { Toc } from './Toc.tsx';
import { TocNavigation } from './TocNavigation.tsx';

type DocLayoutProps = {
    toc: toc.Toc;
    children: preact.ComponentChildren;
};

export function DocLayout({ toc, children }: DocLayoutProps) {
    return (
        <BaseLayout>
            <div class={cx(s.wrapper)}>
                <Toc toc={toc} class={cx(s.navigation)} />
                <main class={cx(s.main, MAIN_CLASSNAME)}>
                    {children}
                    <TocNavigation toc={toc} />
                </main>
            </div>
        </BaseLayout>
    );
}
