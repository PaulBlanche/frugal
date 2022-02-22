/* @jsx preact.h */
/* @jsxFrag preact.Fragment */

import * as preact from 'preact';
import { cx } from '../loader_style/styled.ts';
import { DataProvider } from './dataContext.tsx';

import type { HydrationStrategy } from './types.ts';

type HostProps<PROPS> = {
    className?: string;
    strategy?: HydrationStrategy;
    clientOnly?: boolean;
    query?: string;
    name: string;
    Component: preact.ComponentType<PROPS>;
    props: PROPS;
};

export function Host<PROPS>(
    { className, name, clientOnly = false, Component, props, ...rest }:
        HostProps<
            PROPS
        >,
) {
    if (typeof window.document === 'undefined') {
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
