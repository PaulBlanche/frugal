import { getHierarchy, Toc } from "../../../toc.ts";
import { TocContent } from "./TocContent.tsx";

import tocCss from "./Toc.module.css";
import { clsx } from "$dep/clsx.ts";
import * as icon from "../../../glyphs/icons/mod.ts";
import { DRAWER_ID, OVERLAY_ID, TOGGLE_ID, VERSION_SELECT_ID } from "./Toc.script.ts";

import versions from "../../../../../versions.json" assert { type: "json" };

export type TocProps = {
    toc: Toc;
    class: string;
};

export function Toc({ toc, class: className }: TocProps) {
    const hierarchy = getHierarchy(toc);

    return (
        <>
            <button id={TOGGLE_ID} class={clsx(tocCss["toggle"])}>
                <icon.Toc class={clsx(tocCss["icon"])} />
            </button>
            <nav id={DRAWER_ID} class={clsx(className, tocCss["drawer"])}>
                <div class={clsx(tocCss["select"])}>
                    <select id={VERSION_SELECT_ID}>
                        {versions.map((version) => {
                            return (
                                <option value={version} selected={toc.entries[0].version === version}>
                                    frugal@{version}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <TocContent hierarchies={Object.values(hierarchy.children)} />
            </nav>
            <div id={OVERLAY_ID} class={clsx(tocCss["overlay"])}></div>
        </>
    );
}
