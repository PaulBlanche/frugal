import { className } from '../../../dep/frugal/styled.ts';

export const icon = className('icon')
    .styled`
        width: 0.6em;
        color: #000;
        opacity: 0.25;
    `;

export const anchor = className('anchor')
    .styled`
        margin: 0 0.25em;
        padding: 0 0.25em;

        &:hover ${icon} {
            opacity: 0.5;
        }

    `;

export const heading = className('heading')
    .styled`
        ${anchor} {
            display: none;
        }

        &:hover ${anchor} {
            display: inline-block;
        }
    `;
