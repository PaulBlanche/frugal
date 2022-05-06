import { className, keyframes } from '../dep/frugal/styled.ts';

const spinnerAnimation = keyframes`
  0% {
    transform: rotateZ(0deg);
  }

  100% {
    transform: rotateZ(360deg)
  }
`;

export const spinner = className('loader')
    .styled`
        animation: 2s linear infinite ${spinnerAnimation};
    `;

const circleAnimation = keyframes`
    0%, 25% {
        stroke-dashoffset: 280;
        transform: rotate(0);
        stroke: black
    }
    
    50%, 75% {
        stroke-dashoffset: 75;
        transform: rotate(45deg);
        stroke: #FFE300;
    }

    100% {
        stroke-dashoffset: 280;
        transform: rotate(360deg);
        stroke: black
    }
`;

export const circle = className('loader-circle')
    .styled`
        animation: 1.4s ease-in-out infinite both ${circleAnimation};
        display: block;
        fill: transparent;
        stroke-linecap: round;
        stroke-dasharray: 283;
        stroke-dashoffset: 280;
        stroke-width: 10px;
        transform-origin: 50% 50%;
    `;
