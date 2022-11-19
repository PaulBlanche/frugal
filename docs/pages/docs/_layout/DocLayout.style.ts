import { className } from '../../../dep/frugal/styled.ts';
import { container } from '../../../styles/container.style.ts';

export const wrapper = className('wrapper')
    .extends(container)
    .styled`
        display: flex;
        flex-direction: column;
        
        @media (min-width: 900px) {
            flex-direction: row;
        }
    `;

export const navigation = className('navigation')
    .styled`
        @media (min-width: 900px) {
            flex: 0 0 256px;
            margin-left: 1rem;
            margin-right: 1rem;    
        }
    `;

export const main = className('main')
    .styled`
        flex: 1;
        margin: 0 1rem;

        @media (min-width: 900px) {
            width: 0;
        }
    `;
