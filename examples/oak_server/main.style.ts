import {
    createGlobalStyle,
    className,
} from '../../packages/loader_style/styled.ts';

createGlobalStyle`
    body {
        margin: 0;
    }
`;

export const red = className('red').styled`
    color: red;
`;
