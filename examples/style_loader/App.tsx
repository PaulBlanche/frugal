/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { PageProps, Head } from '../../packages/frugal_preact/mod.server.ts';
import type { Generated } from '../../packages/loader_script/mod.ts';

import './App.style.ts';

type AppProps = PageProps & {
    children: preact.ComponentChildren;
};

export function App({ descriptor, loaderContext, children }: AppProps) {
    const scriptGenerated = loaderContext.get<Generated>('script');
    const esmBundleUrl = scriptGenerated?.[descriptor]['body'];
    const styleUrl = loaderContext.get<string>('style');
    return (
        <>
            <Head>
                <meta charSet='utf-8' />
                <title>toto</title>
                <link rel='stylesheet' href={styleUrl} />
            </Head>
            {children}
            {esmBundleUrl && <script type="module" src={esmBundleUrl}></script>}
        </>
    );
}
