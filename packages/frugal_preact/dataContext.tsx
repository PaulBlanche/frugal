/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import * as hooks from 'preact/hooks';
import './types.ts';

import './session/session.script.ts';
import { NavigatorConfig } from './session/Navigator.ts';
import { PrefetcherConfig } from './session/Prefetcher.ts';
import { Head } from './Head.tsx';

type DataContext = { data: unknown; pathname: string };

const dataContext = preact.createContext<
    DataContext | undefined
>(undefined);

export function useData<DATA>(): DATA {
    const context = hooks.useContext(dataContext);
    if (context === undefined) {
        throw Error('wrap in DataProvider');
    }

    return context.data as DATA;
}

export function usePathname(): string {
    const context = hooks.useContext(dataContext);
    if (context === undefined) {
        throw Error('wrap in DataProvider');
    }

    return context.pathname;
}

type DataProviderProps = {
    embedData?: boolean;
    context?: DataContext;
    children: preact.ComponentChildren;
    prefetch?: Partial<PrefetcherConfig>;
    navigate?: Partial<NavigatorConfig>;
};

export function DataProvider(
    { embedData = false, context, children, prefetch, navigate }:
        DataProviderProps,
) {
    if (typeof document === 'undefined') {
        const configScript = ['window.__FRUGAL__ = window.__FRUGAL__ || {};'];
        if (navigate !== undefined) {
            configScript.push(
                `window.__FRUGAL__.navigate = ${JSON.stringify(navigate)};`,
            );
        }
        if (prefetch !== undefined) {
            configScript.push(
                `window.__FRUGAL__.prefetch = ${JSON.stringify(prefetch)};`,
            );
        }

        return (
            <>
                <Head>
                    {context && embedData && (
                        <script
                            dangerouslySetInnerHTML={{
                                __html: `window.__FRUGAL__.context = ${
                                    JSON.stringify(context)
                                };`
                                    .replace(
                                        /<\/script>/g,
                                        '<\\/script>',
                                    ),
                            }}
                        />
                    )}
                    <script
                        dangerouslySetInnerHTML={{
                            __html: configScript.join(''),
                        }}
                    />
                </Head>
                <dataContext.Provider value={context}>
                    {children}
                </dataContext.Provider>
            </>
        );
    } else {
        return (
            <dataContext.Provider value={window.__FRUGAL__.context}>
                {children}
            </dataContext.Provider>
        );
    }
}
