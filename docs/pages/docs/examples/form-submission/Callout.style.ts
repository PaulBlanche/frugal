import { className, keyframes } from '../../../../dep/frugal/styled.ts';
import * as input from '../../../../styles/input.style.ts';

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

export const icon = className('icon')
    .styled`
        width: 30px;
        height: 30px;
        position: absolute;
        top: 0;
        right: 0;
        padding: 10px;
        cursor: pointer;
        opacity: 0.5;

        &:hover{
            opacity: 1;
        }
    `;

export const callout = className('callout')
    .styled`
        top: 0;
        border: 1px solid #50af51;
        background: #def7de;
        padding: 1em;
        margin: 0.5em;
        position: fixed;
        left: 50%;
        width: 400px;
        animation: 0.4s ${appear};
        animation-fill-mode: forwards;

        ${hiddenInput}:checked + & {
            animation: 0.4s ${disappear};
            animation-fill-mode: forwards;
        }
    `;
