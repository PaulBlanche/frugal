import { className } from '../../../../dep/frugal/styled.ts';

export const wrapper = className('counter')
    .styled`
        background-color: #FFF8BB;
        margin: 2rem 0;
        padding: 1rem 2rem;
        font-size: 2rem;
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    `;

export const button = className('button')
    .styled`
        background: #FFE300;
        border: none;
        width: 4rem;
        height: 4rem;
        font-size: 2rem;

        &:hover {
            background: #CEB800;
        }
    `;

export const value = className('value')
    .styled`
        font-weight: 600;
    `;
