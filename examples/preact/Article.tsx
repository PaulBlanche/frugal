/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';

export type ArticleProps = {
    title: string;
    content: string;
};

export function Article(props: ArticleProps) {
    return (
        <>
            <h1>{props.title}</h1>
            <p>{props.content}</p>
        </>
    );
}
