import { Head, PageProps } from "$dep/frugal/runtime/preact.server.ts";

import "./session.script.ts";

export type BaseLayoutProps = PageProps & {
    children?: preact.ComponentChildren;
};

export function BaseLayout(
    { descriptor, assets, children }: BaseLayoutProps,
) {
    const scriptSrc = assets["script"]?.[descriptor];
    const styleHref = assets["style"]?.[descriptor];
    const globalStyleHref = assets["style"]?.["global"];

    return (
        <>
            <Head>
                <html lang="en" />
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

                <meta
                    name="description"
                    content="Frugal web developpment with a framework that does not waste resources. Do the same, but send less"
                />
                <title>Frugal</title>
                {styleHref && <link rel="stylesheet" href={styleHref} />}
                {globalStyleHref && <link rel="stylesheet" href={globalStyleHref} />}
                {scriptSrc && <script async type="module" src={scriptSrc}></script>}
            </Head>
            {children}
        </>
    );
}
