/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as hooks from 'preact/hooks';
import { cx } from '../dep/frugal/styled.ts';

import { type Toc } from '../toc.ts';
import { Toc as TocComponent } from './Toc.tsx';
import * as svg from '../svg/mod.ts';

import * as s from './MobileToc.style.ts';
import { WRAPPER_ID } from './MobileToc.script.ts';

type MobileTocProps = {
    class?: string;
    toc: Toc;
};

export function MobileToc({ toc, class: className }: MobileTocProps) {
    const id = hooks.useId();

    return (
        <div class={cx(className, s.wrapper)} id={WRAPPER_ID}>
            <input class={cx(s.hiddenInput)} type='checkbox' id={id} />
            <label
                htmlFor={id}
                class={cx(s.overlay)}
            >
                <div class={cx(s.toggle)}>
                    <svg.Toc class={cx(s.icon)} />
                </div>
            </label>
            <TocComponent class={cx(s.toc)} toc={toc} />
        </div>
    );
}
