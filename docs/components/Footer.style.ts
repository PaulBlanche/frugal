import { createGlobalStyle, styled } from '../dep/frugal/styled.ts';
import { container } from '../styles/container.style.ts';

export const footer = styled('footer')`
    display: block;
    background: #F8F8F8;
    border-top: 2px solid #F0F0F0;
    color: #7B7070;
`;

export const footerContainer = styled('footer-container', container)`
    height: 5rem;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
`;

createGlobalStyle`
    body {
        min-height: 100vh;
        position: relative;
        padding-bottom: 5.5rem;

        ${footer} {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
        }
    }
`;
