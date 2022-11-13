/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { Head, PageProps } from '../dep/frugal/preact.server.ts';
import type { Generated } from '../dep/frugal/loader_script.ts';

import './App.style.ts';
import './session.script.ts';

type AppProps = PageProps & {
    children: preact.ComponentChildren;
};

export function App({ descriptor, loaderContext, children }: AppProps) {
    const scriptGenerated = loaderContext.get<Generated>('script');
    const bodyBundleUrl = scriptGenerated?.[descriptor]?.['body'];
    const styleUrl = loaderContext.get<string>('style');
    return (
        <>
            <Head>
                <meta charSet='utf-8' />
                <meta
                    name='viewport'
                    content='width=device-width, initial-scale=1'
                />
                <meta
                    name='description'
                    content='Frugal web developpment with a framework that does not waste resources. Do the same, but send less'
                />
                <title>Frugal</title>
                <link
                    rel='stylesheet'
                    media='screen'
                    href='https://fontlibrary.org//face/cooper-hewitt'
                    type='text/css'
                />
                <html lang='en' />
                {styleUrl && <link rel='stylesheet' href={styleUrl} />}
                {bodyBundleUrl && (
                    <script async type='module' src={bodyBundleUrl}></script>
                )}
            </Head>
            {children}
        </>
    );
}
