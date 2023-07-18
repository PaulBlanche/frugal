//adapted from from https://github.com/lucacasonato/esbuild_deno_loader/blob/main/src/loader_portable.ts
import * as path from "../dep/std/path.ts";

export class Loader {
    #fetchOngoing = new Map<string, Promise<void>>();

    #cache = new Map<string, Uint8Array>();
    #fetchRedirects = new Map<string, string>();

    async load(url: URL): Promise<Uint8Array> {
        try {
            switch (url.protocol) {
                case "file:": {
                    return await this.#loadLocal(url);
                }
                case "http:":
                case "https:":
                case "data:": {
                    return await this.#loadRemote(url.href);
                }
                default:
                    throw new Error("[unreachable] unsupported esm scheme " + url.protocol);
            }
        } catch (e) {
            console.log(url.href);
            throw e;
        }
    }

    async #loadLocal(specifier: URL): Promise<Uint8Array> {
        const filePath = path.fromFileUrl(specifier);

        return await Deno.readFile(filePath);
    }

    async #loadRemote(specifier: string): Promise<Uint8Array> {
        for (let i = 0; i < 10; i++) {
            specifier = this.#resolveRemote(specifier);
            const contents = this.#cache.get(specifier);
            if (contents) return contents;

            let promise = this.#fetchOngoing.get(specifier);
            if (!promise) {
                promise = this.#fetch(specifier);
                this.#fetchOngoing.set(specifier, promise);
            }

            await promise;
        }

        throw new Error("Too many redirects. Last one: " + specifier);
    }

    #resolveRemote(specifier: string): string {
        return this.#fetchRedirects.get(specifier) ?? specifier;
    }

    async #fetch(specifier: string): Promise<void> {
        const resp = await fetch(specifier, {
            redirect: "manual",
        });
        if (resp.status < 200 && resp.status >= 400) {
            throw new Error(
                `Encountered status code ${resp.status} while fetching ${specifier}.`,
            );
        }

        if (resp.status >= 300 && resp.status < 400) {
            await resp.body?.cancel();
            const location = resp.headers.get("location");
            if (!location) {
                throw new Error(
                    `Redirected without location header while fetching ${specifier}.`,
                );
            }

            const url = new URL(location, specifier);
            if (url.protocol !== "https:" && url.protocol !== "http:") {
                throw new Error(
                    `Redirected to unsupported protocol '${url.protocol}' while fetching ${specifier}.`,
                );
            }

            this.#fetchRedirects.set(specifier, url.href);
            return;
        }

        const contents = new Uint8Array(await resp.arrayBuffer());
        this.#cache.set(specifier, contents);
    }
}
