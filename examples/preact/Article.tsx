/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';

export type ArticleProps = {
    title: string;
    content: string;
};

// The _raw_ Article component
export function Article(props: ArticleProps) {
    return (
        <>
            <h1>{props.title}</h1>
            <p>{props.content}</p>
        </>
    );
}
