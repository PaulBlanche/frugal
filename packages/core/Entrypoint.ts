export class Entrypoint {
    path: string;
    url: URL;

    constructor(path: string, root: string) {
        this.path = path;
        this.url = new URL(this.path, `file:///${root}/`);
    }

    async getDescriptor() {
        return await import(String(this.url));
    }
}
