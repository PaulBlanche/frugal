import { styled } from '../../packages/loader_style/styled.ts';

// A style is declared with the `styled` function. The first parameter is a
// hint string, that will prefix the unique id of the class, to help debug
// the styles
const baseParagraph = styled('base-paragraph')`
    font-size: 20px;
`;

// styles can extends other style. This means the component using `staticParagraph`
// as a className will also have the className of `baseParagraph`
export const staticParagraph = styled('static-paragraph', baseParagraph)`
    color: blue;
`;

export const bold = styled('bold')`
    font-weight: 900;
`;
