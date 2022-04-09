import {
    createGlobalStyle,
    styled,
} from '../../packages/loader_style/styled.ts';

createGlobalStyle`
    body: {
        margin: 0;
    }
`;

export const red = styled('red')`
    color: red;
`;
