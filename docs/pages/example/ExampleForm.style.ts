import { className, keyframes } from '../../dep/frugal/styled.ts';

export const formWrapper = className('form-wrapper')
    .styled`
        background-color: #FFF8BB;
        margin: 2rem 0;
        padding: 1rem 2rem;
    `;

export const form = className('form')
    .styled`
        padding: 2rem;
    `;

export const input = className('input')
    .styled`
        padding: 0.5rem 1rem;
        font-size: 1rem;
        color: #555;
        width: 100%;
        margin: 0.5rem 0 0;
    `;

export const error = className('error')
    .styled`
        margin: 0;
        position: absolute;
        bottom: 1rem;
        left: 0;
        font-size: 0.8rem;
        font-weight: bold;
        color: #C83939;
    `;

export const field = className('field')
    .styled`
        flex-direction: column;
        display: flex;
        padding: 0 0 2.5rem;
        position: relative;
    `;

export const submit = className('submit')
    .styled`
        border: none;
        border-radius: 0;
        background: #FFE300;
        padding: 0.75rem 1.5rem;
        margin: 1rem 0;
        font-size: 1rem;
        margin-left: auto;
    `;

export const submitWrapper = className('submitWrapper')
    .styled`
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    `;

const appear = keyframes`
    from {
        opacity: 0;
    }
`;

export const success = className('success')
    .styled`
        animation: 1s ${appear};
        opacity: 1;
        color: #62792F;
        font-weight: bold;
    `;
