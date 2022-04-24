import { styled } from '../../packages/loader_style/styled.ts';

// styles are static (they will compile to css). If you want dynamic css, the
// best approach is to have one style per "state", and have the component
// switch on the className dependencing on its logic.
export const styleA = styled('style-a')`
    color: red;
    font-weight: 900;
`;

export const styleB = styled('style-b')`
    color: blue;
    font-weight: 100
`;
