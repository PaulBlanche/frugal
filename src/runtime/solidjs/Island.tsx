/* @jsxRuntime automatic */
/* @jsxImportSource solid-js */
import * as solid from "solid-js";
import { Hydration, ssr } from "solid-js/web";
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
        Component: solid.Component<PROPS>;
        props: solid.ParentProps<PROPS>;
    } | {
        Component: solid.Component;
    });

const islandContext = solid.createContext(false);

export function Island<PROPS>(
    {
        name,
        clientOnly = false,
        strategy,
        query,
        ...rest
    }: IslandProps<PROPS>,
) {
    const isInIsland = solid.useContext(islandContext);

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
                innerHTML={"props" in rest ? JSON.stringify(rest.props) : undefined}
            />
            <Hydration>
                {!clientOnly && Component}
            </Hydration>
            <IslandEndComment />
        </islandContext.Provider>
    );
}

function IslandEndComment() {
    return (typeof document === "undefined"
        ? ssr(`<!--${ISLAND_END}--\>`)
        : globalThis.document?.createComment(ISLAND_END)) as solid.JSX.Element;
}
