import { className } from '../../dep/frugal/styled.ts';
import { container } from '../../styles/container.style.ts';

export const wrapper = className('wrapper')
    .extends(container)
    .styled`
        display: flex;
        flex-direction: row;
    `;

export const navigation = className('navigation')
    .styled`
        flex: 0 0 256px;
        margin-top: 1rem;
        display: none;
    
        @media (min-width: 900px) {
            display: block;
            margin-right: 1rem
        }
    `;

export const main = className('main')
    .styled`
        flex: 1;
        margin: 0 1rem;
        width: 0;
    `;
