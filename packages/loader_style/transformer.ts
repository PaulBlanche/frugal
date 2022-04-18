import * as styled from './styled.ts';

export async function styleTransformer(
    url: string,
) {
    const stylesheet: { [s: string]: styled.Rules } = await import(url);
    const script = Object.entries(stylesheet).map(
        ([name, rules]) => {
            return `export const ${name} = "${rules.className}"`;
        },
    ).join('\n');

    return script;
}
