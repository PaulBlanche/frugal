import { className } from '../../../../packages/loader_style/styled.ts';
import * as component from './component.style.ts';

export const extendedComponent = className('extended-component')
    .extends(component.component)
    .styled`
        background-color: red;
    `;
