import { className } from '../../../../dep/frugal/styled.ts';
import { activeLink, link } from '../../../../styles/link.style.ts';

export const tocLink = className('toc-link')
    .extends(link)
    .styled`
        text-transform: capitalize;
    `;

export const tocLinkActive = className('toc-link-active')
    .extends(activeLink)
    .styled`
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
        margin: 0;
        padding-left: 1rem;
    `;

export const toc = className('toc')
    .styled`
        width: 256px;
    `;

export const overlay = className('overlay')
    .styled`
        display: block;
        width: 100%;
        height: 100%;
        position: fixed;
        top: 60px;
        left: 0;
        z-index: 1;
        background-color: transparent;
        pointer-events: none;
        transition: background-color 0.2s;
    `;

export const drawer = className('drawer')
    .styled`
        padding-top: 2rem;
        padding-left: 1rem;
        width: 256px;
        padding-bottom: 5rem;

        @media not (min-width: 900px) {
            padding-top: 1rem;
        }

        & > ${tocList} {
            font-weight: bold;
            padding-left: 0;

            & > ${tocItem} {
                list-style: none;
                margin-bottom: 1rem;
            }


            ${tocList} {
                font-weight: normal;
                font-size: 0.9rem;
                padding-left: 2rem;
            }
        }
    `;

export const drawerScript = className('drawer-script')
    .styled`
        overflow: hidden;
        
        @media not (min-width: 900px) {
            position: fixed;
            left: 0;
            top: 60px;
            bottom: 0;
            background: white;
            z-index: 2;
            transform: translateX(-100%);
        }
    `;

export const icon = className('icon')
    .styled`
        width: 32px;
    `;

export const toggle = className('toggle')
    .styled`
        position: absolute;
        top: 0;
        left: 0;
        width: 60px;
        height: 60px;
        background: transparent;
        border: none;
        border-right: 2px solid #F0F0F0;

        &:hover, &:focus {
            background: rgba(0, 0, 0, 0.1);
        }

        @media (min-width: 900px) {
            display: none;
        }
    `;

export const drawerOpen = className('toc-drawer-open')
    .styled`
        transform: translateX(0);
        overflow: auto;
        transition: transform 0.2s;
    `;

export const drawerClose = className('toc-drawer-close')
    .styled`
        transform: translateX(-100%);
        overflow: hidden;
        transition: transform 0.2s;
    `;

export const overlayOpen = className('overlay-open')
    .styled`
        background-color: rgba(0, 0, 0, 0.5);
        pointer-events: initial;
    `;