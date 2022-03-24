import { spy } from './spy.ts';

export class FakeFileSystem {
    env: Map<string, string>;

    constructor(fs: { [s: string]: string } = {}) {
        this.env = new Map<string, string>(Object.entries(fs));
        Deno.readTextFile = spy((path) => this.fakeReadFileText(path));
        Deno.writeTextFile = spy((path, content) =>
            this.fakeWriteFileText(path, content)
        );
        Deno.writeFile = spy((path, content) =>
            this.fakeWriteFileText(path, content.toString())
        );
        Deno.mkdir = spy(() => Promise.resolve());
        Deno.stat = spy((path) => this.fakeStat(path));
    }

    has(path: string) {
        return this.env.has(path);
    }

    set(path: string, content: string) {
        this.env.set(path, content);
    }

    get(path: string) {
        const content = this.env.get(path);
        if (content === undefined) {
            throw Error(`path ${path} not found`);
        }
        return content;
    }

    _cleanPath(path: string | URL): string {
        if (typeof path === 'string') {
            try {
                new URL(path);
                throw Error('no no no');
            } catch {
                return `file://${path}`;
            }
        }
        return String(path);
    }

    fakeReadFileText(path: string | URL) {
        return Promise.resolve(this.get(this._cleanPath(path)));
    }

    fakeWriteFileText(path: string | URL, content: string) {
        return Promise.resolve(this.set(this._cleanPath(path), content));
    }

    fakeStat(path: string | URL): Promise<Deno.FileInfo> {
        if (this.has(this._cleanPath(path))) {
            return Promise.resolve({
                isFile: true,
                isDirectory: false,
                isSymlink: false,
                size: 0,
                mtime: null,
                atime: null,
                birthtime: null,
                dev: null,
                ino: null,
                mode: null,
                nlink: null,
                uid: null,
                gid: null,
                rdev: null,
                blksize: null,
                blocks: null,
            });
        } else {
            return Promise.reject(Deno.errors.NotFound);
        }
    }
}
