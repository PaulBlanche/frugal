import {
    className,
    createGlobalStyle,
    globalClassName,
} from '../../../../packages/loader_style/styled.ts';
import * as component from './component.style.ts';

export const scoped = className('scoped')
    .styled`
        color: red;

        ${component.baseComponent} {
            color: green;
        }
    `;

export const global = globalClassName('global-classname')
    .styled`
        color: blue;

        ${component.baseComponent} {
            color: yellow;
        }
    `;

createGlobalStyle`
    body {
        ${component.baseComponent} {
            color: purple;
        }
    }
`;
