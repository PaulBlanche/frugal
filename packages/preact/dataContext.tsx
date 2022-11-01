/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as preact from 'preact';
import * as hooks from 'preact/hooks';
import './types.ts';

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
};

export function DataProvider(
    { embedData = false, context, children }: DataProviderProps,
) {
    if (typeof document === 'undefined') {
        const script =
            `window.__FRUGAL__ = window.__FRUGAL__ || {}; window.__FRUGAL__.context = ${
                JSON.stringify(context)
            };`.replace(
                /<\/script>/g,
                '<\\/script>',
            );
        return (
            <>
                <Head>
                    {context && embedData && (
                        <script dangerouslySetInnerHTML={{ __html: script }} />
                    )}
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
