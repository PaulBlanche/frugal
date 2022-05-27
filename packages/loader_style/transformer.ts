import * as styled from './styled.ts';

/**
 * Transform the content of a style module to a simple module exporting string
 * classnames
 */
export async function styleTransformer(
    url: string,
) {
    const stylesheet: { [s: string]: unknown } = await import(url);
    const script = Object.entries(stylesheet).map(
        ([name, rule]) => {
            if (rule instanceof styled.ScopedRules) {
                return `export const ${name} = "${rule.className}"
${
                    rule.toCssComment().split('\n').map((line) => {
                        return `// ${line}`;
                    }).join('\n')
                }
`;
            }
        },
    ).join('\n');

    return script;
}
