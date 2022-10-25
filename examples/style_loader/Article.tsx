/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import * as hooks from 'preact/hooks';
import { cx } from '../../packages/loader_style/styled.ts';

import { styleA, styleB } from './Article.style.ts';

export type ArticleProps = {
    title: string;
    content: string;
};

export function Article(props: ArticleProps) {
    const [style, setStyle] = hooks.useState(true);

    return (
        <>
            <h1>{props.title}</h1>
            {
                /* Since styles are static, we need to switch className to achieve
                dynamic styling */
            }
            <p className={cx(style ? styleA : styleB)}>{props.content}</p>
            <button onClick={() => setStyle(!style)}>Toggle style</button>
        </>
    );
}
