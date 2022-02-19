/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import { Host } from '../../packages/frugal_preact/mod.client.ts';

import { NAME } from './Article.script.ts';
import { Article as ArticleBase, ArticleProps } from './Article.tsx';

export function Article(props: ArticleProps) {
    return <Host props={props} Component={ArticleBase} name={NAME} />;
}
