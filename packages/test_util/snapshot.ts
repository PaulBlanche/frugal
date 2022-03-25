import * as fs from '../../dep/std/fs.ts';
import * as path from '../../dep/std/path.ts';
import * as asserts from '../../dep/std/asserts.ts';
import * as murmur from '../murmur/mod.ts';

export function snapshot(testfileMeta: string) {
    const dir = path.dirname(new URL(testfileMeta).pathname);

    return { assertSnapshot };

    function assertSnapshot(
        name: string,
        value: any,
        forceRegenerate?: boolean,
    ) {
        const snapshotName = new murmur.Hash().update(name).alphabetic();
        asserts.assertEquals(
            readSnapshot(snapshotName, value, forceRegenerate),
            value,
        );
    }

    function readSnapshot(name: string, value: any, forceRegenerate = false) {
        const file = path.join(dir, `.snpashot/${name}.json`);
        if (forceRegenerate) {
            return generateSnapshot(file, value);
        }

        try {
            const data = Deno.readTextFileSync(file);
            return JSON.parse(data);
        } catch (error) {
            return generateSnapshot(file, value);
        }
    }

    function generateSnapshot(file: string, value: any) {
        fs.ensureFileSync(file);
        Deno.writeTextFileSync(file, JSON.stringify(value));
        return value;
    }
}
