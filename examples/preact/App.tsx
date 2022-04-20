/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import { AppProps, Head } from '../../packages/frugal_preact/mod.server.ts';
import type { Generated } from '../../packages/loader_script/mod.ts';

// This component will wrap the whole application. This is the best place to
// insert data from the `loaderContext`. This component will only ever render
// server side.
export function App({ entrypoint, loaderContext, children }: AppProps) {
    const scriptGenerated = loaderContext.get<Generated>('script');
    const esmBundleUrl = scriptGenerated?.[entrypoint]?.['esm'];
    return (
        <>
            <Head>
                <meta charSet='utf-8' />
                <title>toto</title>
            </Head>
            {children}
            <script src={esmBundleUrl}></script>
        </>
    );
}
