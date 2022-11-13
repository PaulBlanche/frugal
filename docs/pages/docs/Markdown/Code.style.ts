import { atImport, className } from '../../../dep/frugal/styled.ts';

atImport(
    'https://raw.githubusercontent.com/ericwbailey/a11y-syntax-highlighting/main/dist/prism/a11y-dark.css',
);

export const highlight = className('highlight')
    .styled`
        && { 
            border-radius: 0px;
            margin-left: -1rem; 
            margin-right: -1rem; 
            padding: 16px;
            font-size: 85%;
            line-height: 1.45;
            overflow: auto;

            @media (min-width: 900px) {
                border-radius: 6px;
                margin-left: 0; 
                margin-right: 0; 
            }
        }
    `;
