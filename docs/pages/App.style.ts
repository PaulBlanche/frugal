import { className, createGlobalStyle } from '../dep/frugal/styled.ts';

export const loadingSpinner = className('loading-spinner')
    .styled`
        width: 30px;
        position: fixed;
        bottom: 30px;
        right: 30px;
    `;

createGlobalStyle`
    body {
        font: 16px/1.5 sans; 
        margin: 0;
    }

    html {
        box-sizing: border-box;
    }
    *, *:before, *:after {
        box-sizing: inherit;
    }

    body:not(.frugal-prefetch-loading) ${loadingSpinner} {
        display: none;
    }
`;
