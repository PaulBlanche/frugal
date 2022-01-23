import { build } from "../generator.ts";
import * as fs from "../../../dep/std/fs.ts";
import * as asserts from "../../../dep/std/asserts.ts";
import * as assert from "../../assert/mod.ts";
import * as path from "../../../dep/std/path.ts";
import * as murmur from "../../murmur/mod.ts";
import * as log from "../../log/mod.ts";

await log.setup({
  type: "human",
  loggers: {
    "worker:1": "DEBUG",
    "worker-pool": "DEBUG",
    "build": "DEBUG",
    "page": "DEBUG",
  },
});

const TEST_ROOT = path.dirname(new URL(import.meta.url).pathname);

type Fs = {
  root: string;
  clean: () => Promise<void>;
};

async function makeFs(files: { [name: string]: string }): Promise<Fs> {
  const id = new murmur.Hash().update(String(Date.now())).update(
    String(Math.random()),
  ).alphabetic();
  const tempDir = path.resolve(TEST_ROOT, `./.tmp_${id}`);
  await fs.ensureDir(tempDir);

  for (const [name, content] of Object.entries(files)) {
    await Deno.writeTextFile(path.resolve(tempDir, name), content);
  }

  return {
    root: tempDir,
    clean: async () => {
      await Deno.remove(tempDir, { recursive: true });
    },
  };
}

function withFs(
  files: { [name: string]: string },
  body: (fs: Fs) => Promise<void> | void,
): () => Promise<void> {
  return async () => {
    const fs = await makeFs(files);

    try {
      await body(fs);
    } catch (e) {
      throw e;
    } finally {
      await fs.clean();
    }
  };
}

Deno.test(
  "toto",
  withFs({
    "./entrypoint1.ts": ``,
  }, async ({ root }) => {
    await asserts.assertRejects(async () => {
      await build({
        root: root,
        loaders: [],
        outputDir: "../dist",
        pages: [
          "entrypoint1.ts",
        ],
      });
    }, (error: any) => {
      asserts.assert(error instanceof assert.AssertionError);
      asserts.assert(
        /^Page descriptor ".*" has no getRequestList function$/.test(
          error.message,
        ),
      );
    });
  }),
);

Deno.test(
  "toto",
  withFs({
    "./entrypoint1.ts": `
        import './module1.script.ts'

        export function getRequestList() {
            return ['toto']
        }
        export function getData() {
            return {}
        }
        export function getUrl() {
            return 'toto.html'
        }
        export function getContent() {
            return 'bubu'
        }
    `,
    "./module1.script.ts": `
        //foo.ts
    `,
  }, async ({ root }) => {
    await build({
      root: root,
      loaders: [],
      outputDir: "./dist",
      pages: [
        "entrypoint1.ts",
      ],
    });
  }),
);
