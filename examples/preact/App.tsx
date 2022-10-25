/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { PageProps, Head } from '../../packages/frugal_preact/mod.server.ts';
import type { Generated } from '../../packages/loader_script/mod.ts';


type AppProps = PageProps & {
    children: preact.ComponentChildren;
};

// This component will wrap the whole application. This is the best place to
// insert data from the `loaderContext`. This component will only ever render
// server side.
export function App({ descriptor, loaderContext, children }: AppProps) {
    const scriptGenerated = loaderContext.get<Generated>('script');
    const esmBundleUrl = scriptGenerated?.[descriptor]?.['body'];
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
