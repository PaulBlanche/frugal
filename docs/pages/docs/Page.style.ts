import { className } from '../../dep/frugal/styled.ts';
import { link } from '../../styles/link.style.ts';
import { highlight } from './Markdown/Code.style.ts';
import { anchor } from './Markdown/Heading.style.ts';
import { callout } from './Markdown/Callout.style.ts';

export const markdown = className('markdown')
    .styled`
        padding: 2rem 0;

        *:not(${highlight}) code {
            background: rgba(0, 0, 0, 0.1);
            padding: 0.2rem 0.5rem;
            border-radius: 6px;
            font-size: 85%;
        }

        a:not(${anchor}) { 
            ${link.css} 
        }

        p, ${callout}, blockquote, ul, ol {
            margin-top: 16px;
            margin-bottom: 16px;
        }

        h1, h2, h3, h4, h5, h6 {
            margin-top: 2em;
            margin-bottom: 1em;
        }

        ul {
            padding-left: 2em;
        }
    `;
