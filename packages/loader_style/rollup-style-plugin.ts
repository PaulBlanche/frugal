import * as rollup from '../../dep/rollup.ts';
import * as styled from './styled.ts';

type Config = {
    test: (url: string) => boolean;
};

export function style({ test }: Config): rollup.Plugin {
    return {
        name: 'frugal-style',
        async transform(_code, id) {
            if (test(id)) {
                const stylesheet: { [s: string]: styled.Rules } = await import(
                    getModuleUrl(id).toString()
                );
                const script = Object.entries(stylesheet).map(
                    ([name, rules]) => {
                        return `export const ${name} = "${rules.className}"`;
                    },
                ).join('\n');

                return { code: script, map: null };
            }
            return null;
        },
    };
}

// rollup comes from node world, where every module is local. This means that
// absolute url imports (http:// and file://) are treated correctly, but relative
// import stay relative. 
// So if we find an id that is not parsable as URL, this means that it is a relative
// import to a local module
function getModuleUrl(id: string): URL {
    try {
        return new URL(id)
    } catch {
        return new URL(`file://${id}`)
    }
}