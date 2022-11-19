/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as preact from 'preact';
import * as signal from 'preact/signals';
import * as hooks from 'preact/hooks';
import './types.ts';

import { Head } from './Head.tsx';

type DataContext = { data: unknown; pathname: string };

const dataContext = preact.createContext<
    DataContext | undefined | null
>(undefined);

export function useData<DATA>(): DATA {
    const context = hooks.useContext(dataContext);
    if (context === null) {
        throw Error('wrap in DataProvider');
    }
    if (context === undefined) {
        throw Error('data was not embeded');
    }

    return context.data as DATA;
}

export function usePathname(): string {
    const context = hooks.useContext(dataContext);
    if (context === null) {
        throw Error('wrap in DataProvider');
    }
    if (context === undefined) {
        throw Error('data was not embeded');
    }

    return context.pathname;
}

type DataProviderProps = {
    count: signal.Signal<number>;
    embedData?: boolean;
    context?: DataContext;
    children: preact.ComponentChildren;
};

export function DataProvider(
    { embedData = false, context, children, count }: DataProviderProps,
) {
    const [_, rerender] = hooks.useState(count.value);
    signal.effect(() => {
        rerender(count.value);
    });

    if (typeof document === 'undefined') {
        const script = `window.__FRUGAL__ = ${JSON.stringify({ context })};`
            .replace(
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
