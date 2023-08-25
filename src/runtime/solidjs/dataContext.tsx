/* @jsxRuntime automatic */
/* @jsxImportSource solid-js */
import * as solid from "solid-js";
import "./types.ts";

type DataContext = {
    data?: unknown;
    embedData: boolean;
    pathname: string;
    server?: boolean;
};

const dataContext = solid.createContext<DataContext | undefined | null>(
    undefined,
);

export function useData<DATA>(): DATA {
    const context = solid.useContext(dataContext);
    if (context === null || context === undefined) {
        throw Error("wrap in DataProvider");
    }

    if (!context.embedData && !context.server) {
        throw Error("data was not embeded in document");
    }

    return context.data as DATA;
}

export function usePathname(): string {
    const context = solid.useContext(dataContext);
    if (context === null || context === undefined) {
        throw Error("wrap in DataProvider");
    }

    return context.pathname;
}

type DataProviderProps = {
    context?: DataContext;
    children: solid.JSX.Element;
};

export function DataProvider(
    { context, children }: DataProviderProps,
) {
    // server side we inject the serialized context in a script and wrap
    // the tree in a `dataContext.Provider` to forward data.
    if (typeof document === "undefined" && context) {
        const script = `window.__FRUGAL__ = ${
            JSON.stringify({ ...context, data: context.embedData ? context.data : undefined })
        };`
            // needed because the context might contain html that could
            // accidentaly close the script early
            .replace(
                /<\/script>/g,
                "<\\/script>",
            );
        return (
            <>
                <script innerHTML={script} />
                <dataContext.Provider value={{ ...context, server: true }}>
                    {children}
                </dataContext.Provider>
            </>
        );
    }

    // client side we pick the context that was injected server side and wrap
    // the tree in a `dataContext.Provider` to forward data.
    return (
        <dataContext.Provider value={window.__FRUGAL__.context}>
            {children}
        </dataContext.Provider>
    );
}
