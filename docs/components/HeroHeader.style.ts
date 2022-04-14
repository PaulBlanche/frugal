import { styled } from '../../packages/loader_style/styled.ts';

export const heroHeader = styled('hero-header')`
    display: flex;
    flex-direction: column;
    text-align: center;
    padding: 5rem;
`;

export const title = styled('title')`
    font-size: 4.5rem;
    margin: 0;
    color: #333;
    letter-spacing: -0.13em;
    overflow: hidden;
`;

export const extra = styled('extra')`
  font-weight: initial;
`;

export const highlight = styled('highlight')`
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

export const tagline = styled('tagline')`
    font-size: 1.5rem;
    color: #666;
    margin: 3rem 0 0;
`;

export const compactHeroHeader = styled('compact-hero-header')`
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
