/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import * as hooks from 'preact/hooks';
import './types.ts';

type DataContext = { data: any; url: string };

const dataContext = preact.createContext<
    DataContext | undefined
>(undefined);

export function useData<DATA>(): DATA {
    const context = hooks.useContext(dataContext);
    if (context === undefined) {
        throw Error('wrap in DataProvider');
    }

    return context.data;
}

export function useUrl(): string {
    const context = hooks.useContext(dataContext);
    if (context === undefined) {
        throw Error('wrap in DataProvider');
    }

    return context.url;
}

type DataProviderProps = {
    context?: DataContext;
    children: preact.ComponentChildren;
};

export function DataProvider({ context, children }: DataProviderProps) {
    if (typeof window.document === 'undefined') {
        return (
            <>
                {context && (
                    <script
                        dangerouslySetInnerHTML={{
                            __html:
                                `window.__FRUGAL__ = window.__FRUGAL__ || {}; 
window.__FRUGAL__.context = ${JSON.stringify(context)}`.replace(
                                    /<\/script>/g,
                                    '<\\/script>',
                                ),
                        }}
                    />
                )}
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