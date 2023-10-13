import * as _type from "./_type/Manifest.js";
export * from "./_type/Manifest.js";

import * as fs from "../dependencies/fs.js";
import * as path from "../dependencies/path.js";
import * as xxhash from "../dependencies/xxhash.js";

import { FrugalConfig } from "./Config.js";

class ManifestExecutionError extends Error {}

/**
 * @param {FrugalConfig} config
 * @returns {Promise<_type.Manifest>}
 */
export async function loadManifest(config) {
    const name = await getManifestName(config);
    if (name === undefined) {
        throw Error("No manifest was built");
    }
    const manifestPath = path.resolve(config.outdir, name);

    try {
        return await import(
            config.platform === "deno" ? path.toFileURL(manifestPath).href : manifestPath
        );
    } catch (/** @type {any} */ error) {
        throw new ManifestExecutionError(
            `Error while loading manifest ${manifestPath}: ${error.message}`,
            {
                cause: error,
            },
        );
    }
}

/**
 * @param {FrugalConfig} config
 * @param {_type.WritableManifest} manifest
 */
export async function writeManifest(config, manifest) {
    const content = manifestContent(config, manifest);
    const hash = (await xxhash.create()).update(content).digest();

    const manifestName = `manifest-${hash}.mjs`;
    await setManifestName(config, manifestName);

    const filePath = path.resolve(config.outdir, manifestName);
    try {
        await fs.writeTextFile(filePath, content, { createNew: true });
    } catch (/** @type {any} */ error) {
        if (!(error instanceof fs.errors.AlreadyExists)) {
            throw error;
        }
    }
}

/**
 * @param {FrugalConfig} config
 * @returns {Promise<string | undefined>}
 */
export async function getManifestName(config) {
    const manifestNamePath = path.resolve(config.outdir, "manifestname");
    try {
        return await fs.readTextFile(manifestNamePath);
    } catch (/** @type {any} */ error) {
        if (!(error instanceof fs.errors.NotFound)) {
            throw error;
        }
    }
}

/**
 * @param {FrugalConfig} config
 * @param {string} name
 */
async function setManifestName(config, name) {
    const manifestNamePath = path.resolve(config.outdir, "manifestname");
    await fs.writeTextFile(manifestNamePath, name);
}

/**
 * @param {FrugalConfig} config
 * @param {_type.WritableManifest} manifest
 * @returns
 */
function manifestContent(config, manifest) {
    return `${manifest.pages
        .map((page) => {
            const pagePath = path.resolve(config.rootdir, page.outputPath);
            const importIdentifier = `./${path.relative(config.outdir, pagePath)}`;
            return `import * as descriptor_${page.moduleHash} from "./${importIdentifier}";`;
        })
        .join("\n")}

export const id = ${JSON.stringify(manifest.id)};
export const config = ${JSON.stringify(manifest.config)};
export const assets = ${JSON.stringify(manifest.assets)};
export const pages = [${manifest.pages
        .map(
            (page) =>
                `{
    "moduleHash": "${page.moduleHash}",
    "entrypoint": "${page.entrypoint}",
    "descriptor": descriptor_${page.moduleHash},
}`,
        )
        .join(",\n")}];
`;
}
