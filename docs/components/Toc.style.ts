import { className } from '../dep/frugal/styled.ts';
import { activeLink, link } from '../styles/link.style.ts';

export const tocLink = className('toc-link')
    .extends(link)
    .styled`
        text-transform: capitalize;
    `;

export const tocLinkActive = className('toc-link-active')
    .styled`
        ${activeLink.css}
    `;

export const tocItem = className('toc-item')
    .styled`
        margin-top: 0.4rem;

        &::before {
            counter-increment: section;
            content: counters(section,".") " ";
            font-weight: bold;
        }
    `;

export const tocList = className('toc-list')
    .styled`
        counter-reset: section;
        list-style: none;
        padding-left: 1rem;
    `;

export const toc = className('toc').styled``;
