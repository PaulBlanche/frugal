import { NativeLoader } from './NativeLoader.ts';
import { PortableLoader } from './PortableLoader.ts';
import * as shared from './shared.ts';

export class Loader implements shared.Loader {
    #nativeLoader: NativeLoader;
    #portableLoader: PortableLoader;

    constructor(options: shared.LoaderOptions) {
        this.#nativeLoader = new NativeLoader(options);
        this.#portableLoader = new PortableLoader();
    }

    async resolve(specifier: URL) {
        try {
            return await this.#nativeLoader.resolve(specifier);
        } catch {
            return await this.#portableLoader.resolve(specifier);
        }
    }

    async loadEsm(specifier: string) {
        try {
            return await this.#nativeLoader.loadEsm(specifier);
        } catch {
            return await this.#portableLoader.loadEsm(specifier);
        }
    }
}
