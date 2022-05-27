/**
 * Initializes `swc`'s wasm module and re-exports its api.
 */

// this file was generated by the `./cache.ts` module. Do not change it.

import initSwc from 'https://esm.sh/@swc/wasm-web@1.2.172';

await initSwc(new URL('swc.wasm', import.meta.url));

export * from 'https://esm.sh/@swc/wasm-web@1.2.172';
export type {
    ExportAllDeclaration,
    ExportNamedDeclaration,
    ImportDeclaration,
    Node,
    Script,
} from 'https://esm.sh/@swc/core@1.2.172/types.d.ts';