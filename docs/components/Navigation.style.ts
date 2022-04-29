import { className } from '../dep/frugal/styled.ts';
import { container } from '../styles/container.style.ts';
import { baseLink } from '../styles/link.style.ts';

export const wrapper = className('wrapper')
    .styled`
        display: block;
        background: #F8F8F8;
        border-bottom: 2px solid #F0F0F0;
    `;

export const navigation = className('navigation')
    .extends(container)
    .styled`
        display: flex;
        flex-direction: row;
        justify-content: center;
        font-size: 0.9rem;
    `;

export const entry = className('entry')
    .extends(baseLink)
    .styled`
        padding: 1rem;
        margin: 0 1rem;
        opacity: 0.6;
        text-decoration-line: none;

        &:hover, &:focus {
            text-decoration-line: underline;
        }
    `;

export const entryActive = className('entry-active')
    .styled`
        opacity: 1;
        font-weight: bold;
        text-decoration-line: underline;
    `;
