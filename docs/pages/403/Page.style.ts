import { className, keyframes } from '../../dep/frugal/styled.ts';
import { container } from '../../styles/container.style.ts';

export const mainContainer = className('main-container')
    .extends(container)
    .styled`
        max-width: 800px;
        margin-bottom: 5rem;
        margin-top: 5rem;
        padding: 0 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;

        @media (min-width: 660px) {         
            padding: 0;
        }

    `;

const glitchAll = keyframes`
    2%,64%{
      transform: translate(2px,0) skew(0deg);
    }
    4%,60%{
      transform: translate(-2px,0) skew(0deg);
    }
    62%{
      transform: translate(0,0) skew(5deg); 
    }
`;

const glitchTop = keyframes`
    2%,64%{
      transform: translate(2px,-2px);
    }
    4%,60%{
      transform: translate(-2px,2px);
    }
    62%{
      transform: translate(13px,-1px) skew(-13deg); 
    }
`;

const glitchBottom = keyframes`
    2%,64%{
      transform: translate(-2px,0);
    }
    4%,60%{
      transform: translate(-2px,0);
    }
    62%{
      transform: translate(-22px,5px) skew(21deg); 
    }
`;

export const status = className('status')
    .styled`
        font-size: 4rem;
        padding: 1rem;
    `;

export const glitchContainer = className('glitch-container')
    .styled`
        background: #FFE300;
        padding: 0.5rem 2rem;
        display: inline-block;
    `;

export const glitch = className('glitch')
    .styled`
        font-family: monospace;
        font-size: 5rem;
        font-weight: 600;
        position: relative;
        animation: ${glitchAll} 1.2s linear 2;
        animation-fill-mode: both;

        &::before,
        &::after {
            content: attr(title);
            position: absolute;
            left: 0;
        }

        &::before {
            animation: ${glitchTop} 1s linear 1;
            clip-path: polygon(0 0, 100% 0, 100% 33%, 0 33%);
            animation-fill-mode: both;
        }

        &:after{
            animation: ${glitchBottom} 1.5s linear 2;
            clip-path: polygon(0 67%, 100% 67%, 100% 100%, 0 100%);
            animation-fill-mode: both;
        }

    `;

export const description = className('description')
    .styled`
            margin-top: 2rem;
            text-align: center;
        `;
