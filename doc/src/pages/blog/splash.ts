import * as path from "$dep/std/path.ts";
import * as fs from "$dep/std/fs.ts";
import * as xxhash from "$dep/xxhash.ts";
import { Gravity, ImageMagick, initialize, MagickFormat, MagickGeometry } from "$dep/imagemagick_deno.ts";

export async function splash(imagePath: string, publicdir: string) {
    const imageHash = (await xxhash.create()).update(imagePath).digest("hex").toString();
    const assetPath = `image/${imageHash}.jpeg`;
    const assetURL = `/${assetPath}`;
    const filePath = path.resolve(publicdir, assetPath);

    if (!await exists(filePath)) {
        await splashTransform(imagePath, filePath);
    }

    return assetURL;
}

let INITIALIZE_PROMISE: Promise<void>;

async function splashTransform(src: string, dest: string) {
    if (INITIALIZE_PROMISE === undefined) {
        INITIALIZE_PROMISE = initialize();
    }
    await INITIALIZE_PROMISE;

    const data = await Deno.readFile(src);

    await ImageMagick.read(data, async (img) => {
        const geometry = new MagickGeometry("900x512^");
        img.resize(geometry);
        img.extent(geometry, Gravity.Center);

        img.quality = 75;

        await img.write(
            MagickFormat.Jpeg,
            async (data: Uint8Array) => {
                await fs.ensureFile(dest);
                await Deno.writeFile(dest, data);
            },
        );
    });
}

async function exists(path: string) {
    try {
        await Deno.stat(path);
        return true;
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return false;
        }
        throw error;
    }
}
