import * as murmur from '../murmur/mod.ts';

export function raw(asset: URL) {
    return { url: `/${url(asset)}`, asset };
}

function url(url: URL) {
    const hash = new murmur.Hash().update(url.href).digest('alphanumeric');
    const basename = url.pathname.slice(url.pathname.lastIndexOf('/') + 1);
    const extname = basename.slice(basename.lastIndexOf('.'));
    const filename = basename.slice(0, basename.lastIndexOf('.'));

    return `raw/${filename}-${hash.toUpperCase()}${extname}`;
}
