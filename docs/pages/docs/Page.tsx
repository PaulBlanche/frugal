/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { cx } from '../../dep/frugal/styled.ts';
import { useData } from '../../dep/frugal/preact.client.ts';
import { PageProps } from '../../dep/frugal/preact.server.ts';

import { DocLayout } from './_layout/DocLayout.tsx';
import { Markdown } from './Markdown/mod.tsx';
import { Data } from './type.ts';

import * as s from './Page.style.ts';

export function Page(props: PageProps) {
    const { markup, toc } = useData<Data>();

    return (
        <DocLayout toc={toc} {...props}>
            <Markdown markup={markup} class={cx(s.markdown)} />
        </DocLayout>
    );
}
