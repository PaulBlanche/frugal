import * as preact from "preact";
import { render } from "preact-render-to-string";
import { marked } from "$dep/marked.ts";

import { Heading } from "./Heading.tsx";
import { Code, CodeProps } from "../../../components/code/Code.tsx";
import { Link } from "./Link.tsx";
import { CodeSpan } from "./CodeSpan.tsx";

export class Renderer extends marked.Renderer {
    #toc: { label: string; id: string }[];

    constructor() {
        super();
        this.#toc = [];
    }

    get toc() {
        return this.#toc;
    }

    reset() {
        this.#toc = [];
    }

    heading(
        text: string,
        level: 1 | 2 | 3 | 4 | 5 | 6,
        raw: string,
        slugger: marked.Slugger,
    ) {
        const id = `heading-${slugger.slug(raw)}`;

        if (level === 2) {
            this.#toc.push({ id, label: text });
        }

        return render(
            preact.h(Heading, {
                level,
                id,
                text,
            }),
        );
    }

    code(code: string, language?: string) {
        return render(
            preact.h(Code, { code, ...getCodeProps(code, language) }),
        );
    }

    codespan(code: string): string {
        return render(preact.h(CodeSpan, { code }));
    }

    link(href: string, title: string, text: string) {
        return render(preact.h(Link, { href, title, text }));
    }
}

const PROTOCOL_REGEXP = /^(?:[a-z+]+:)?\/\//;
export function hasProtocl(href: string) {
    return PROTOCOL_REGEXP.test(href);
}

function getCodeProps(code: string, language?: string): CodeProps {
    const file: CodeProps["files"][number] = { code, filename: "" };
    const props: CodeProps = { files: [file] };

    if (language === undefined) {
        return props;
    }

    const directiveList = language.split(" ");
    const cleanLanguage = directiveList[0];

    props.files[0].language = cleanLanguage;

    for (const directive of directiveList.slice(1)) {
        const splitIndex = directive.indexOf("=");
        const name = directive.slice(0, splitIndex === -1 ? undefined : splitIndex);
        const value = directive.slice(splitIndex + 1);
        switch (name) {
            case "lines": {
                props.files[0].highlights = value.slice(1, -1).split(",").map((range) => {
                    const [startStr, endStr = startStr] = range.split("-");
                    return [Number(startStr), Number(endStr)];
                });
                break;
            }
            case "filename": {
                props.files[0].filename = value;
                break;
            }
            case "no-line-numbers": {
                props.noLineNumbers = true;
                break;
            }
        }
    }

    return props;
}
