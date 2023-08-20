import { Head, PageProps } from "$dep/frugal/runtime/preact.server.ts";

import "./session.script.ts";
//import "./search.script.ts";

export type BaseLayoutProps = PageProps & {
    children?: preact.ComponentChildren;
};

export function BaseLayout(
    { assets, children }: BaseLayoutProps,
) {
    const scriptSrcs = assets.get("script");
    const styleHrefs = assets.get("style");

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
                {scriptSrcs.map((src) => {
                    return <script async type="module" src={src}></script>;
                })}
                {styleHrefs.map((href) => {
                    return <link rel="stylesheet" href={href} />;
                })}
            </Head>
            {children}
        </>
    );
}
