/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { cx } from '../../dep/frugal/styled.ts';
import { BaseLayout } from '../_layout/BaseLayout.tsx';

import * as s from './Page.style.ts';
import { PageProps } from '../../dep/frugal/preact.server.ts';

export function Page(props: PageProps) {
    return (
        <BaseLayout {...props}>
            <main class={cx(s.mainContainer)}>
                <div>
                    <div className={cx(s.glitchContainer)}>
                        <span title='> 404' className={cx(s.glitch)}>
                            &gt; 404
                        </span>
                    </div>
                    <span class={cx(s.status)}>Not Found</span>
                </div>

                <p class={cx(s.description)}>
                    The page you were looking for does not exist.
                </p>
            </main>
        </BaseLayout>
    );
}
