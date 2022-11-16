import { className } from '../../dep/frugal/styled.ts';
import { container } from '../../styles/container.style.ts';
import { baseLink } from '../../styles/link.style.ts';

export const navigation = className('navigation')
    .styled`
        display: flex;
        background: #F8F8F8;
        border-bottom: 2px solid #F0F0F0;
        height: 60px;
    `;

export const navigationContainer = className('navigation-container')
    .extends(container)
    .styled`
        display: flex;
        flex-direction: row;
        justify-content: center;
        font-size: 0.9rem;
    `;

export const navigationWithButton = className('navigation-with-button')
    .styled`
        @media (max-width: 360px) {         
            margin-left: 60px;
        }
    `;

export const entry = className('entry')
    .extends(baseLink)
    .styled`
        padding: 1rem;
        opacity: 0.6;
        text-decoration-line: none;

        &:hover, &:focus {
            text-decoration-line: underline;
        }

        @media (min-width: 660px) {         
            margin: 0 1rem;
        }
    `;

export const entryActive = className('entry-active')
    .extends(entry)
    .styled`
        opacity: 1;
        font-weight: bold;
        text-decoration-line: underline;
    `;
