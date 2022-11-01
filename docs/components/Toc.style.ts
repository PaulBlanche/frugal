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
        background: none;

        &::after {
            content: "";
            display: block;
            position: absolute;
            background: #FFE300;
            width: 256px;
            right: 0;
            height: 1.5rem;
            top: 0;
            z-index: -1;
        }
    `;

export const tocItem = className('toc-item')
    .styled`
        margin-top: 0.4rem;
        position: relative;

        &::before {
            font-weight: bold;
        }
    `;

export const tocList = className('toc-list')
    .styled`
        padding-left: 1rem;
    `;

export const toc = className('toc')
    .styled`
        & > ${tocList} {
            font-weight: bold;

            & > ${tocItem} {
                list-style: none;
                margin-bottom: 1rem;
            }


            ${tocList} {
                font-weight: normal;
                font-size: 0.9rem;
            }
        }
    `;
