import { className } from '../dep/frugal/styled.ts';

export const hiddenInput = className('hidden-input')
    .styled`
        position: absolute;
        display: inline-block;
        cursor: pointer;
        opacity: 0;
        width: 0;
        height: 0;
        z-index: 0;
    `;
