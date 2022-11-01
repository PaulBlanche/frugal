import { atImport, className } from '../dep/frugal/styled.ts';
import { link } from '../styles/link.style.ts';

atImport('https://esm.sh/prismjs@1.29.0/themes/prism-tomorrow.css');

export const markdown = className('markdown')
    .styled`
        padding: 2rem 0;

        /*a:not(.anchor) { 
            ${link.css} 
        }

        && h1, && h2 {
            border: none;
            display: flex;

            a.anchor {
                order: 1;
                margin-left: 10px;
            }
        }*/
    `;
