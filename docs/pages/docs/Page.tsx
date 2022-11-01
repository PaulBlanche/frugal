/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { cx } from '../../dep/frugal/styled.ts';
import { useData } from '../../dep/frugal/preact.client.ts';
import { PageProps } from '../../dep/frugal/preact.server.ts';

import { Layout } from '../../components/Layout.tsx';
import { Markdown } from '../../components/Markdown.tsx';
import { Toc } from '../../components/Toc.tsx';
import { TocNavigation } from '../../components/TocNavigation.tsx';
import { App } from '../App.tsx';
import * as s from './Page.style.ts';
import { Data } from './type.ts';

export function Page(props: PageProps) {
    const { markup, toc } = useData<Data>();

    return (
        <App {...props}>
            <Layout toc={toc}>
                <div class={cx(s.wrapper)}>
                    <div class={cx(s.navigation)}>
                        {/*<HeroHeader compact children={'Docs'} />*/}
                        <Toc toc={toc} />
                    </div>
                    <main class={cx(s.main)}>
                        <Markdown markup={markup} />
                        <TocNavigation toc={toc} />
                    </main>
                </div>
            </Layout>
        </App>
    );
}
