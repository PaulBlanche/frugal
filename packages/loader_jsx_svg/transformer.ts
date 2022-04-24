import { SpriteSheet } from './spritesheet.ts';

export async function svgTransformer(
    url: string,
) {
    // deno-lint-ignore no-explicit-any
    const module: { [s: string]: any } = await import(url);
    const script = Object.entries(module).map(
        ([name, value]) => {
            if (value instanceof SpriteSheet) {
                return '';
            }
            return `export const ${name} = "${value}"`;
        },
    ).join('\n');

    return script;
}
