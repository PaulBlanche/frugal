import { clsx } from "$dep/clsx.ts";
import { Highlight } from "./Highlight.tsx";

import code from "./Code.module.css";
import "./Code.script.ts";
import { File } from "./type.ts";
import { Clipboard } from "../../glyphs/icons/Clipboard.tsx";
import { Check } from "../../glyphs/icons/mod.ts";

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
                    {files.length === 1
                        ? (
                            <span class={clsx(code["tab"])} data-toggle-id={files[0].filename} data-active>
                                {files[0].filename}
                            </span>
                        )
                        : files.map((file, index) => (
                            <button class={clsx(code["tab"])} data-toggle-id={file.filename} data-active={index === 0}>
                                {file.filename}
                            </button>
                        ))}
                </div>
            )}
            {!hideTabs && (
                <button data-copy class={clsx(code["copy"])}>
                    <Clipboard class={clsx(code["icon"], code["cta"])} />
                    <Check class={clsx(code["icon"], code["success"])} />
                </button>
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
