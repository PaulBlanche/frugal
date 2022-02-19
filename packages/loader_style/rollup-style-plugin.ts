import * as rollup from '../../dep/rollup.ts';
import * as styled from './styled.ts';

type Config = {
    test: RegExp;
};

export function style({ test }: Config): rollup.Plugin {
    return {
        name: 'frugal-style',
        async transform(_code, id) {
            if (test.test(id)) {
                const stylesheet: { [s: string]: styled.Rules } = await import(
                    id
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
