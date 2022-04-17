import { createGlobalStyle } from '../dep/frugal/styled.ts';

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
`;
