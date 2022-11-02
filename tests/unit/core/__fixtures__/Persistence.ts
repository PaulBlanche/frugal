import {
    NotFound,
    Persistence,
} from '../../../../packages/core/Persistence.ts';
import { spy } from '../../../../dep/std/mock.ts';

class MemoryPersistence implements Persistence {
    memory: Map<string, string>;

    constructor() {
        this.memory = new Map();
    }

    set(path: string, content: string) {
        this.memory.set(path, content);
        return Promise.resolve();
    }

    read(path: string) {
        const content = this.memory.get(path);
        if (content === undefined) {
            throw new NotFound(`path ${path} was not found`);
        }
        return Promise.resolve(content);
    }

    open(path: string): Promise<ReadableStream<Uint8Array>> {
        const content = this.memory.get(path);
        return Promise.resolve(
            new ReadableStream<Uint8Array>({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(content));
                    controller.close();
                },
            }),
        );
    }

    delete(path: string) {
        this.memory.delete(path);
        return Promise.resolve();
    }
}

type FakePersistenceConfig = {
    mock?: {
        set?: Persistence['set'];
        read?: Persistence['read'];
        open?: Persistence['open'];
        delete?: Persistence['delete'];
    };
};

export function fakePersistence({ mock = {} }: FakePersistenceConfig = {}) {
    const persistence = new MemoryPersistence();

    const _set = persistence.set;
    persistence.set = spy(mock.set ?? _set.bind(persistence));

    const _read = persistence.read;
    persistence.read = spy(mock.read ?? _read.bind(persistence));

    const _open = persistence.open;
    persistence.open = spy(mock.open ?? _open.bind(persistence));

    const _delete = persistence.delete;
    persistence.delete = spy(mock.delete ?? _delete.bind(persistence));

    return persistence;
}
