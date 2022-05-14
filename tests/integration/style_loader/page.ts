import type * as frugal from '../../../packages/core/mod.ts';
import { cx } from '../../../packages/loader_style/styled.ts';
import { extendedComponent } from './styles/extended-component.style.ts';
import { global, scoped } from './styles/global.style.ts';
import { animated } from './styles/animation.style.ts';

export const self = new URL(import.meta.url);

export const pattern = '';

export function getStaticData() {
    return {};
}

export function getPathList() {
    return [{}];
}

export function getContent({ loaderContext }: frugal.GetContentParams<{}, {}>) {
    const styleHref = loaderContext.get('style');

    return `<html>
    <head>
        <link rel="stylesheet" href="${styleHref}" />
    </head>
    <body>
        <div class="${cx(extendedComponent)}" />
        <div class="${cx(global)}" />
        <div class="${cx(scoped)}" />
        <div class="${cx(animated)}" />
    </body>
</html>`;
}
