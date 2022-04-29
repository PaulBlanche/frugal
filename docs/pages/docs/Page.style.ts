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
        flex: 0 0 300px;
        margin-top: 1rem;
    `;

export const main = className('main')
    .styled`
        flex: 1;
    `;
