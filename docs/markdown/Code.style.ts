import { atImport, className } from '../dep/frugal/styled.ts';

atImport(
    'https://raw.githubusercontent.com/PrismJS/prism-themes/v1.9.0/themes/prism-one-light.css',
);

export const highlight = className('highlight')
    .styled`
        && { 
            border-radius: 6px;
            margin-left: -1rem; 
            margin-right: -1rem; 
            padding: 16px;
            font-size: 85%;
            line-height: 1.45;
            overflow: auto;

            @media (min-width: 900px) {
                margin-left: 0; 
                margin-right: 0; 
            }
        }
    `;
