import { className } from '../dep/frugal/styled.ts';
import { link } from '../styles/link.style.ts';
import { highlight } from '../markdown/Code.style.ts';
import { anchor } from '../markdown/Heading.style.ts';
import { callout } from '../markdown/Callout.style.ts';

export const markdown = className('markdown')
    .styled`
        padding: 2rem 0;

        *:not(${highlight}) code {
            background: #f0f0f0;
            padding: 0.2rem 0.5rem;
            border-radius: 6px;
            font-size: 85%;
        }

        a:not(${anchor}) { 
            ${link.css} 
        }

        p, ${callout}, blockquote, ul, ol {
            margin: 16px 0;
        }

        h1, h2, h3, h4, h5, h6 {
            margin-top: 2em;
            margin-bottom: 1em;
        }

        ul {
            padding-left: 2em;
        }
    `;
