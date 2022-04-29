import { className } from '../../../../packages/loader_style/styled.ts';

export const baseComponent = className('base-component')
    .styled`
        color: red;
        background-color: blue;
    `;

export const component = className('component')
    .extends(baseComponent)
    .styled`
        color: blue;
        font-size: 100px;
    `;

export const componentDerived = className('component-derived')
    .styled`
        ${component.css}
        font-size: 50px;
    `;
