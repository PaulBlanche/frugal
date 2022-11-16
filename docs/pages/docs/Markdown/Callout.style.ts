import { className } from '../../../dep/frugal/styled.ts';

export const callout = className('callout')
    .styled`
        padding: 2rem 1rem 0rem;
        position: relative;
        border: 2px solid transparent;
        border-radius: 6px;

        &::before {
            text-transform: uppercase;
            font-weight: bold;
            position: absolute;
            padding: 5px;
            top: 0;
            left: 0;
            border: 2px solid transparent;
            border-top: none;
            border-left: none;
        }

    `;

export const warning = className('warning')
    .extends(callout)
    .styled`
        background-color: #FDF08C;
        border-color: #FFEA3F;

        &::before {
            content: "warning :";
            background-color: #FFEA3F;
        }
    `;

export const info = className('info')
    .extends(callout)
    .styled`
        background-color: #B0DAFF;
        border-color: #75BEFF;

        &::before {
            content: "info :";
            background-color: #75BEFF;
        }
    `;
