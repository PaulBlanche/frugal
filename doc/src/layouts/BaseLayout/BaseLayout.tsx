/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { Head, PageProps } from '$dep/frugal/runtime/preact.server.ts';

import { Navigation } from './Navigation.tsx';
import { Footer } from './Footer.tsx';

import './BaseLayout.css';
import './session.script.ts';

export type BaseLayoutProps = PageProps & {
    children: preact.ComponentChildren;
};

export function BaseLayout(
    { descriptor, assets, children }: BaseLayoutProps,
) {
    const scriptSrc = assets['script']?.[descriptor];
    const styleHref = assets['style']?.[descriptor];

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
                    href='https://fonts.googleapis.com/css2?family=Fjalla+One&display=swap'
                    rel='stylesheet'
                />
                <html lang='en' />
                {styleHref && <link rel='stylesheet' href={styleHref} />}
                {scriptSrc && <script async type='module' src={scriptSrc}></script>}
            </Head>

            <Navigation />
            {children}
            <Footer />
        </>
    );
}
