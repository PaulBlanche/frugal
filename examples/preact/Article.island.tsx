/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import { Island } from '../../packages/frugal_preact/mod.client.ts';

import { NAME } from './Article.script.ts';
import { Article as ArticleBase, ArticleProps } from './Article.tsx';

// The server-side version of the raw `Article` component. This will setup all
// necessary data for this component to be hydratable. The `props` of the
// component must be serializable though.
export function Article(props: ArticleProps) {
    return <Island props={props} Component={ArticleBase} name={NAME} />;
}
