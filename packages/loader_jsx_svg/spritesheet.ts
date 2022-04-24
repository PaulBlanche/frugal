import * as murmur from '../../packages/murmur/mod.ts';

// deno-lint-ignore no-explicit-any
export const SPRITESHEETS: SpriteSheet<any>[] = [];

type SpriteSheetConfig<NODE> = {
    render: (node: NODE) => string;
    name?: string;
};

class Sprite<NODE> {
    children: NODE;
    id: string;
    spritesheet: SpriteSheet<NODE>;

    constructor(
        children: NODE,
        id: string,
        spritesheet: SpriteSheet<NODE>,
    ) {
        this.children = children;
        this.id = id;
        this.spritesheet = spritesheet;
    }

    url(): string {
        return `${this.spritesheet.url()}#${this.id}`;
    }
}

export class SpriteSheet<NODE> {
    name?: string;
    sprites: Sprite<NODE>[];
    render: (node: NODE) => string;

    constructor({ render, name = 'spritesheet' }: SpriteSheetConfig<NODE>) {
        this.name = name;
        this.sprites = [];
        this.render = render;
        SPRITESHEETS.push(this);
    }

    sprite(children: NODE, name = 'sprite') {
        const hash = new murmur.Hash().update(this.render(children)).update(
            name ?? '',
        ).alphabetic();

        const id = `${name}-${hash}`;
        const sprite = new Sprite(children, id, this);

        this.sprites.push(sprite);

        return sprite;
    }

    url() {
        const hash = this.sprites.reduce((hash, sprite) => {
            return hash.update(sprite.id);
        }, new murmur.Hash()).alphabetic();

        return `/svg/${this.name}.${hash}.svg`;
    }

    output(jsx: (name: string, props: any) => NODE) {
        return this.render(jsx(
            'svg',
            {
                xmlns: 'http://www.w3.org/2000/svg',
                children: jsx(
                    'defs',
                    {
                        children: this.sprites.map((sprite) => {
                            return jsx(
                                'g',
                                {
                                    key: sprite.id,
                                    id: sprite.id,
                                    children: sprite.children,
                                },
                            );
                        }),
                    },
                ),
            },
        ));
    }
}
