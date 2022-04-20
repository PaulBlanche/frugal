/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import { AppProps, Head } from '../../packages/frugal_preact/mod.server.ts';
import type { Generated } from '../../packages/loader_script/mod.ts';

import './App.style.ts';

export function App({ entrypoint, loaderContext, children }: AppProps) {
    const scriptGenerated = loaderContext.get<Generated>('script');
    const esmBundleUrl = scriptGenerated?.[entrypoint]['esm'];
    const styleUrl = loaderContext.get('style');
    return (
        <>
            <Head>
                <meta charSet='utf-8' />
                <title>toto</title>
                <link rel='stylesheet' href={styleUrl} />
            </Head>
            {children}
            {esmBundleUrl && <script src={esmBundleUrl}></script>}
        </>
    );
}
