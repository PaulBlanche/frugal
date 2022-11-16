import { className } from '../../dep/frugal/styled.ts';

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
        && { 
            transform: translateX(0);
            overflow: auto;
            transition: transform 0.2s;
        }
    `;

export const drawerClose = className('toc-drawer-open')
    .styled`
        && {
            transform: translateX(-100%);
            overflow: hidden;
            transition: transform 0.2s;
        }
    `;

export const overlayOpen = className('overlay-open')
    .styled`
        && {
            background-color: rgba(0, 0, 0, 0.5);
            pointer-events: initial;
        }
    `;
