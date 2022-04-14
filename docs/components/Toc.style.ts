import { styled } from '../dep/frugal/styled.ts';
import { activeLink, link } from '../styles/link.style.ts';

export const tocLink = styled('toc-link', link)`
  text-transform: capitalize;
`;

export const tocLinkActive = styled('toc-link-active')`
    ${activeLink.css}
`;

export const tocItem = styled('toc-item')`
    margin-top: 0.4rem;

    &::before {
        counter-increment: section;
        content: counters(section,".") " ";
        font-weight: bold;
    }
`;

export const tocList = styled('toc-list')`
    counter-reset: section;
    list-style: none;
    padding-left: 2rem;
`;

export const toc = styled('toc')``;
