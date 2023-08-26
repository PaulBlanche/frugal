/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as hooks from "preact/hooks";
import * as preact from "preact";
import type { HydrationStrategy } from "./types.ts";

export const ISLAND_END = "frugal-island-end";

export type IslandProps<PROPS> =
    & {
        strategy?: HydrationStrategy;
        clientOnly?: boolean;
        query?: string;
        name: string;
    }
    & ({
        Component: preact.ComponentType<PROPS>;
        props: preact.RenderableProps<PROPS>;
    } | {
        Component: preact.ComponentType;
    });

const islandContext = preact.createContext(false);

export function Island<PROPS>(
    {
        name,
        clientOnly = false,
        strategy,
        query,
        ...rest
    }: IslandProps<PROPS>,
) {
    const isInIsland = hooks.useContext(islandContext);

    const Component = "props" in rest ? <rest.Component {...rest.props} /> : <rest.Component />;

    // client side or inside an island, simply render the component
    if (typeof document !== "undefined" || isInIsland) {
        return Component;
    }

    // server-side and not in an island, render an island. The `script` element
    // marks the start of the island "dom range". The `NoDiff` end comment marks
    // the end. Those two nodes will be used by the hydration to avoid forcing a
    // root node around an island
    return (
        <islandContext.Provider value={true}>
            <script
                data-frugal-hydratable={name}
                data-frugal-hydration-strategy={strategy ?? "load"}
                data-frugal-hydration-query={query}
                type="application/json"
                dangerouslySetInnerHTML={"props" in rest ? { __html: JSON.stringify(rest.props) } : undefined}
            />
            {!clientOnly && Component}
            {preact.h(`!--${ISLAND_END}--`, null)}
        </islandContext.Provider>
    );
}
