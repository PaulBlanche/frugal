import { usePathname } from "$dep/frugal/src/runtime/preact/dataContext.tsx";
import { entryMatchHref, getHierarchy, Toc } from "../../toc.ts";
import { TocContent } from "./TocContent.tsx";
import tocCss from "./Toc.module.css";
import { clsx } from "$dep/clsx.ts";
import * as icon from "../../../../glyphs/icons/mod.ts";
import { DRAWER_ID, NAV_ID, OVERLAY_ID, TOGGLE_ID, VERSION_SELECT_ID } from "./Toc.script.ts";

export type TocProps = {
    version: string;
    toc: Toc;
    class: string;
};

export function Toc({ toc, class: className, version }: TocProps) {
    const pathname = usePathname();
    const hierarchy = getHierarchy(toc, version);

    const options = Object.values(toc).reduce((options, tocVersion) => {
        const entry = tocVersion.entries.find((entry) => entryMatchHref(entry, version, pathname));
        if (entry) {
            options.push(tocVersion.version);
        }
        return options;
    }, [] as string[]);

    return (
        <>
            <div id={DRAWER_ID}>
                <button id={TOGGLE_ID} class={clsx(tocCss["toggle"])}>
                    <icon.Toc class={clsx(tocCss["icon"], tocCss["toc"])} />
                    <icon.Close class={clsx(tocCss["icon"], tocCss["close"])} />
                </button>
                <nav id={NAV_ID} class={clsx(className, tocCss["nav"])}>
                    {options.length > 1 && (
                        <div class={clsx(tocCss["select"])}>
                            <select id={VERSION_SELECT_ID}>
                                {options.map((versionOption) => {
                                    return (
                                        <option value={versionOption} selected={version === versionOption}>
                                            frugal@{versionOption}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}
                    <TocContent hierarchies={Object.values(hierarchy.children)} version={version} />
                </nav>
            </div>
            <div id={OVERLAY_ID} class={clsx(tocCss["overlay"])}></div>
        </>
    );
}
