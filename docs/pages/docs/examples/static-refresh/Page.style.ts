import { className } from '../../../../dep/frugal/styled.ts';
import { container } from '../../../../styles/container.style.ts';

export const mainContainer = className('main-container')
    .extends(container)
    .styled`
        max-width: 600px;
        margin-top: 2rem;
        padding: 0 1rem;
    `;
