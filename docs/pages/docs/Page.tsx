/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import { cx } from '../../dep/frugal/styled.ts';
import { useData } from '../../dep/frugal/frugal_preact.client.ts';
import { Data } from './type.ts';
import { Layout } from '../../components/Layout.tsx';

import { Markdown } from '../../components/Markdown.tsx';
import { Toc } from '../../components/Toc.tsx';
import { TocNavigation } from '../../components/TocNavigation.tsx';

import * as s from './Page.style.ts';

export function Page() {
    const { markup, toc } = useData<Data>();
    return (
        <Layout>
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
    );
}
