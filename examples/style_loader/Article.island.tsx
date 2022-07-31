/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { Island } from '../../packages/frugal_preact/mod.client.ts';

import { NAME } from './Article.script.ts';
import { Article as ArticleBase, ArticleProps } from './Article.tsx';

export function Article(props: ArticleProps) {
    return <Island props={props} Component={ArticleBase} name={NAME} />;
}
