export type SVGFile = { url: string; sprites: Sprite[] };

const SVG_FILES: Record<string, SVGFile> = {};

export type Sprite = {
    id: string;
    children: unknown;
};

export function svgUrl(name: string) {
    return `/svg/${name}.svg`;
}

export function spriteurl(name: string, id: string) {
    return `${svgUrl(name)}#${id}`;
}

export function sprite(name: string, sprite: Sprite) {
    SVG_FILES[name] = SVG_FILES[name] || { url: svgUrl(name), sprites: [] };
    SVG_FILES[name].sprites.push(sprite);
}

export function output() {
    return SVG_FILES;
}
