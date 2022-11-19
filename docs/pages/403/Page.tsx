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
                        <span title='> 403' className={cx(s.glitch)}>
                            &gt; 403
                        </span>
                    </div>
                    <span class={cx(s.status)}>Forbidden</span>
                </div>

                <p class={cx(s.description)}>
                    You don't have permission to access this page.
                </p>
            </main>
        </BaseLayout>
    );
}
