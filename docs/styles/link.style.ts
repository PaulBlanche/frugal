import { className } from '../dep/frugal/styled.ts';

export const baseLink = className('base-link')
    .styled`
        color: #000;
        text-underline-offset: 0.2rem;
        text-decoration-line: underline;
        text-decoration-thickness: 2px;
        text-decoration-style: solid;
    `;

export const activeLink = className('active-link')
    .styled`
        background-position-y: 0;
        text-decoration-style: solid;
        text-decoration-color: black;
    `;

export const link = className('link')
    .extends(baseLink)
    .styled`
        background: left 0.8rem no-repeat linear-gradient(0deg, #FFF 0.2rem, #FFE300 0.2rem, #FFE300 1rem, #FFF 1rem);
        text-decoration-style: dotted;
        text-decoration-color: #888;
        transition: background-position 0.1s;

        &:hover, &:focus {
            ${activeLink.css}
        }
    `;
