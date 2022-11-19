/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as hooks from 'preact/hooks';
import * as preact from 'preact';
import type { HydrationStrategy } from './types.ts';

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

    const Component = 'props' in rest
        ? <rest.Component {...rest.props} />
        : <rest.Component />;

    if (typeof document === 'undefined' && !isInIsland) {
        return (
            <islandContext.Provider value={true}>
                {preact.h(
                    `!--start-no-diff--`,
                    null,
                )}

                <script
                    data-hydratable={name}
                    data-hydration-strategy={strategy ?? 'load'}
                    data-hydration-query={query}
                    type='application/json'
                    dangerouslySetInnerHTML={'props' in rest
                        ? { __html: JSON.stringify(rest.props) }
                        : undefined}
                />
                {!clientOnly && Component}
                {clientOnly && <div /> /* empty node for hydration */}
                {preact.h(
                    `!--end-no-diff--`,
                    null,
                )}
            </islandContext.Provider>
        );
    }

    return Component;
}
