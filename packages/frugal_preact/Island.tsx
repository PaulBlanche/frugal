/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import { cx } from '../loader_style/styled.ts';

import type { HydrationStrategy } from './types.ts';

export type IslandProps<PROPS> = {
    className?: string;
    strategy?: HydrationStrategy;
    clientOnly?: boolean;
    query?: string;
    name: string;
    Component: preact.ComponentType<PROPS>;
    props: PROPS;
};

export function Island<PROPS>(
    { className, name, clientOnly = false, Component, props, ...rest }:
        IslandProps<
            PROPS
        >,
) {
    if (typeof document === 'undefined') {
        return (
            <div
                className={cx(`host-${name}`, className)}
                data-hydratable={name}
                data-hydration-strategy={rest.strategy ?? 'load'}
                data-hydration-query={rest.query}
            >
                <script
                    type='application/json'
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(props) }}
                />
                {!clientOnly && <Component {...props} />}
            </div>
        );
    }

    return <Component {...props} />;
}
