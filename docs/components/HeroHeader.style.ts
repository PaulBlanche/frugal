import { className } from '../dep/frugal/styled.ts';

export const heroHeader = className('hero-header')
    .styled`
        display: flex;
        flex-direction: column;
        text-align: center;
        padding: 5rem 1rem;

        @media (min-width: 660px) {
            padding: 5rem;
        }
    `;

export const title = className('title')
    .styled`
        font-size: 4.5rem;
        margin: 0;
        color: #333;
        letter-spacing: -0.13em;
        overflow: hidden;
    `;

export const extra = className('extra')
    .styled`
    font-weight: initial;
    `;

export const highlight = className('highlight')
    .styled`
        position: relative;
        padding: 0 0.5em;

        &::before {
            content: "";
            display: block;
            background: #FFE300;
            position: absolute;
            top: 39%;
            left: 0rem;
            z-index: -1;
            bottom: 22%;
            right: 0rem;
            transform: rotateZ(-3deg);
            transform-origin: center;
            transition: top 0.2s, bottom 0.2s;
        }

        &:hover::before {
            top: -1rem;
            bottom: -1rem;
        }
    `;

export const tagline = className('tagline')
    .styled`
        font-size: 1.5rem;
        color: #666;
        margin: 3rem 0 0;
    `;

export const compactHeroHeader = className('compact-hero-header')
    .styled`
        padding: 1rem;
        text-align: initial;

        ${title} {
            font-size: 1.5rem;
        }
        ${tagline} {
            font-size: 0.8rem;
            margin: 0 0 0 0.8rem;
        }
    `;
