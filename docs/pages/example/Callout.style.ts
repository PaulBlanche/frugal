import { className, keyframes } from '../../dep/frugal/styled.ts';
import * as input from '../../styles/input.style.ts';

export const hiddenInput = className('')
    .extends(input.hiddenInput)
    .styled``;

const appear = keyframes`
    from {
        transform: translate(-50%, -100vh);
    }

    to {
        transform: translate(-50%, 0);
    }
`;

const disappear = keyframes`
    from {
        transform: translate(-50%, 0);
    }

    to {
        transform: translate(-50%, -100vh);
    }
`;

export const callout = className('callout')
    .styled`
        top: 0;
        border: 1px solid black;
        background: white;
        padding: 1em;
        margin: 0.5em;
        position: fixed;
        left: 50%;
        width: 400px;
        animation: 0.2s ${appear};
        animation-fill-mode: forwards;

        ${hiddenInput}:checked + & {
            animation: 0.2s ${disappear};
            animation-fill-mode: forwards;
        }
    `;
