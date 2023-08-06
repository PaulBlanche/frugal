import * as path from "../../../dep/std/path.ts";
import * as dotenv from "../../../dep/std/flags.ts";
import * as colors from "../../../dep/std/fmt/colors.ts";
import { CacheType, ExportType, Framework, toCacheType, toExportType, toFramework, VALID_CACHE } from "./types.ts";

export type Config = {
    root: string;
    exportType: ExportType;
    cacheType: CacheType;
    framework: Framework;
    force: boolean;
};

export function getConfig(args: string[]): Config {
    const flags = dotenv.parse(args, {
        string: ["export", "cache", "framework"],
        boolean: ["force", "help"],
        default: {
            "force": false,
        },
    });

    if (flags._[0]) {
        const exportType = toExportType(flags.export);
        if (exportType === undefined) {
            throw Error(
                `invalid export type "${flags.export}". Valid values are: ${Object.values(ExportType).join(", ")}`,
            );
        }

        const cacheType = toCacheType(flags.cache);
        if (cacheType === undefined || VALID_CACHE[exportType].includes(cacheType)) {
            throw Error(
                `invalid cache type "${flags.cache}". Valid values are: ${VALID_CACHE[exportType].join(", ")}`,
            );
        }

        const framework = toFramework(flags.framework);
        if (framework === undefined) {
            throw Error(
                `invalid cache type "${flags.framework}". Valid values are: ${Object.values(Framework).join(", ")}`,
            );
        }

        const root = path.resolve(String(flags._[0]));

        if (!isEmpty(root) && !flags.force) {
            console.error(`The directory ${root} is not empty. Use --force to overwrite it.`);
            Deno.exit(1);
        }

        return {
            root,
            exportType,
            cacheType,
            framework,
            force: flags.force,
        };
    }

    const name = askUntil("Enter a project name", {
        default: "frugal-project",
    });
    const root = path.resolve(name);

    const force = isEmpty(root) ||
        confirm(colors.yellow(`The directory ${root} is not empty. Do you want to overwrite it ?`));

    if (!isEmpty(root) && !force) {
        console.error(`The directory is not empty.`);
        Deno.exit(1);
    }

    const exportType = askUntil("Choose an export type", {
        head: "Projects have to be exported for specific plateform to be deployed.",
        default: ExportType.NO_EXPORT,
        values: Object.values(ExportType),
        sanitize: (exportType) => toExportType(exportType),
    });

    const cacheType = VALID_CACHE[exportType].length === 1
        ? VALID_CACHE[exportType][0]
        : askUntil("Choose an cache type", {
            head: "Frugal will have to cache static pages in some storage.",
            default: VALID_CACHE[exportType][0],
            values: VALID_CACHE[exportType],
            sanitize: (cacheType) => toCacheType(cacheType),
        });

    const framework = askUntil("Choose an framework", {
        head: "Frugal works with different frameworks.",
        default: Framework.NO_FRAMEWORK,
        values: Object.values(Framework),
        sanitize: (exportType) => toFramework(exportType),
    });

    return {
        root,
        exportType,
        cacheType,
        framework,
        force,
    };
}

function ask(message: string): string | undefined;
function ask(message: string, _default: string): string;
function ask(message: string, _default?: string): string | undefined;
function ask(message: string, _default?: string): string | undefined {
    const value = prompt(message, _default ? colors.gray(_default) : undefined);
    if (value === null) {
        return undefined;
    }
    return colors.stripColor(value);
}

type AskUntilConfig<VALUE> = {
    head?: string;
    default?: string;
    values?: string[];
    sanitize?: (userValue: string | undefined) => VALUE | undefined;
};

function askUntil<VALUE = string>(
    message: string,
    { head, default: _default, values, sanitize = (x) => (x as any) }: AskUntilConfig<VALUE>,
): VALUE {
    const askMessageParts = [colors.bold(message)];
    if (values) {
        askMessageParts.push(`(${values.join(", ")})`);
    }

    const askMessage = askMessageParts.join(" ");

    console.log("");
    head && console.log(colors.gray(`>> ${head}`));

    while (true) {
        const userValue = ask(askMessage, _default);

        const sanitizedValue = sanitize(userValue);

        if (sanitizedValue !== undefined) {
            return sanitizedValue;
        }

        const errorMessageParts = [`invalid value "${userValue}".`];
        if (values) {
            errorMessageParts.push(`Valid values are: ${values.join(", ")}`);
        }

        console.log(colors.red(errorMessageParts.join(" ")));
    }
}

function isEmpty(path: string) {
    try {
        const dir = [...Deno.readDirSync(path)];
        const isEmpty = dir.length === 0 ||
            dir.length === 1 && dir[0].name === ".git";

        return isEmpty;
    } catch (error) {
        if ((error instanceof Deno.errors.NotFound)) {
            return true;
        }
        throw error;
    }
}
