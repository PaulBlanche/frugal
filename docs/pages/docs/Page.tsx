/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { cx } from '../../dep/frugal/styled.ts';
import { useData } from '../../dep/frugal/frugal_preact.client.ts';
import { Data } from './type.ts';
import { Layout } from '../../components/Layout.tsx';

import { Markdown } from '../../components/Markdown.tsx';
import { Toc } from '../../components/Toc.tsx';
import { TocNavigation } from '../../components/TocNavigation.tsx';

import * as s from './Page.style.ts';
import { App } from '../App.tsx';
import { PageProps } from '../../dep/frugal/frugal_preact.server.ts';

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
