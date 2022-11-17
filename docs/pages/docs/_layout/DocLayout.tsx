/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { cx } from '../../../dep/frugal/styled.ts';

import * as toc from '../toc.ts';
import { BaseLayout, BaseLayoutProps } from '../../_layout/BaseLayout.tsx';
import { MAIN_CLASSNAME } from './MobileToggle.tsx';

import * as s from './DocLayout.style.ts';
import { Toc } from './Toc.tsx';
import { TocNavigation } from './TocNavigation.tsx';

type DocLayoutProps = BaseLayoutProps & {
    toc: toc.Toc;
};

export function DocLayout({ toc, children, ...props }: DocLayoutProps) {
    return (
        <BaseLayout {...props}>
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
