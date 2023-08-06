import { clsx } from "$dep/frugal/doc/dep/clsx.ts";
import { Highlight } from "./Highlight.tsx";

import code from "./Code.module.css";
import "./Code.script.ts";
import { File } from "./type.ts";

export type CodeProps = {
    files: File[];
    class?: string;
    noLineNumbers?: boolean;
};

export function Code({ files, class: className, noLineNumbers }: CodeProps) {
    const hasOnlyOneFile = files.length === 1;
    const hasNoFilenames = files.every((file) => file.filename === "");

    const hideTabs = hasOnlyOneFile && hasNoFilenames;

    return (
        <div data-code class={clsx(code["wrapper"], "code-display", className)}>
            {!hideTabs && (
                <div class={clsx(code["tabs"])}>
                    {files.map((file, index) => (
                        <button class={clsx(code["tab"])} data-toggle-id={file.filename} data-active={index === 0}>
                            {file.filename}
                        </button>
                    ))}
                </div>
            )}
            <div class={clsx(code["codes"])}>
                {files.map((file, index) => (
                    <Highlight
                        data-active={index === 0}
                        aria-hidden={index !== 0}
                        class={clsx(code["code"])}
                        file={file}
                        noLineNumbers={noLineNumbers}
                    />
                ))}
            </div>
        </div>
    );
}
