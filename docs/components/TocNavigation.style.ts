import { className } from '../dep/frugal/styled.ts';
import { link } from '../styles/link.style.ts';

export const tocNavigation = className('toc-navigation')
    .styled`
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin: 2rem 1rem;
    `;

export const tocLink = className('toc-navigation-link')
    .extends(link)
    .styled``;

export const carret = className('carret')
    .styled`
        width: 24px;
        height: 24px;
        vertical-align: bottom;
    `;

export const linkPrevious = className('previous')
    .styled`
        text-align: left;
        margin-right: auto;
    `;

export const linkNext = className('next')
    .styled`
        text-align: right;
        margin-left: auto;

        ${carret} {
            transform: rotateZ(180deg);
        }
    `;
