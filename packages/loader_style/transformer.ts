import { Transformer } from '../loader_script/frugalPlugin.ts';
import * as styled from './styled.ts';

export const styleTransformer: Transformer['transform'] = async (
    url,
    content,
) => {
    const stylesheet: { [s: string]: styled.Rules } = await import(url);
    const script = Object.entries(stylesheet).map(
        ([name, rules]) => {
            return `export const ${name} = "${rules.className}"`;
        },
    ).join('\n');

    return script;
};
