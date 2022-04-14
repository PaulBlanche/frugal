import { styled } from '../../packages/loader_style/styled.ts';
import { link } from '../styles/link.style.ts';

export const tocNavigation = styled('toc-navigation')`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin: 2rem 1rem;
`;

export const tocLink = styled('toc-navigation-link', link)`
`;

export const carret = styled('carret')`
      width: 24px;
      height: 24px;
      vertical-align: bottom;
`;

export const linkPrevious = styled('previous')`
    text-align: left;
    margin-right: auto;

`;

export const linkNext = styled('next')`
    text-align: right;
    margin-left: auto;

    ${carret} {
        transform: rotateZ(180deg);
    }

`;
