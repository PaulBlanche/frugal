import codespan from "./CodeSpan.module.css";

type CodeSpanProps = {
    code: string;
};

export function CodeSpan({ code }: CodeSpanProps) {
    return (
        <code
            class={codespan["code-span"]}
            dangerouslySetInnerHTML={{ __html: code }}
        />
    );
}
