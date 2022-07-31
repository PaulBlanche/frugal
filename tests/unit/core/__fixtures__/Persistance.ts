import {
    NotFound,
    Persistance,
} from '../../../../packages/core/Persistance.ts';
import { spy } from '../../../../dep/std/mock.ts';

class MemoryPersistance implements Persistance {
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

type FakePersistanceConfig = {
    mock?: {
        set?: Persistance['set'];
        read?: Persistance['read'];
        open?: Persistance['open'];
        delete?: Persistance['delete'];
    };
};

export function fakePersistance({ mock = {} }: FakePersistanceConfig = {}) {
    const persistance = new MemoryPersistance();

    const _set = persistance.set;
    persistance.set = spy(mock.set ?? _set.bind(persistance));

    const _read = persistance.read;
    persistance.read = spy(mock.read ?? _read.bind(persistance));

    const _open = persistance.open;
    persistance.open = spy(mock.open ?? _open.bind(persistance));

    const _delete = persistance.delete;
    persistance.delete = spy(mock.delete ?? _delete.bind(persistance));

    return persistance;
}
