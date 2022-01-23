import * as fs from "../../dep/std/fs.ts";
import * as path from "../../dep/std/path.ts";
import * as asserts from "../../dep/std/asserts.ts";
import * as murmur from "../murmur/mod.ts";

export function snapshot(testfileMeta: string) {
  const dir = path.dirname(new URL(testfileMeta).pathname);

  return { assertSnapshot };

  function assertSnapshot(name: string, value: any) {
    const snapshotName = new murmur.Hash().update(name).alphabetic();
    asserts.assertEquals(readSnapshot(snapshotName, value), value);
  }

  function readSnapshot(name: string, value: any) {
    const file = path.join(dir, `.snpashot/${name}.json`);
    try {
      const data = Deno.readTextFileSync(file);
      return JSON.parse(data);
    } catch (error) {
      fs.ensureFileSync(file);
      Deno.writeTextFileSync(file, JSON.stringify(value));
      return value;
    }
  }
}
