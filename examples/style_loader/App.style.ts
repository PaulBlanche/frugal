import { createGlobalStyle } from '../../packages/loader_style/styled.ts';

// You can create global style, that will be outputed "as is" at the top
// of the generated css, in declaration order.
createGlobalStyle`
    body {
        margin: 0;
        background: yellow;
    }
`;
