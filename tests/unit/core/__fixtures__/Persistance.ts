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

    get(path: string) {
        const content = this.memory.get(path);
        if (content === undefined) {
            throw new NotFound(`path ${path} was not found`);
        }
        return Promise.resolve(content);
    }

    delete(path: string) {
        this.memory.delete(path);
        return Promise.resolve();
    }
}

type FakePersistanceConfig = {
    mock?: {
        set?: Persistance['set'];
        get?: Persistance['get'];
        delete?: Persistance['delete'];
    };
};

export function fakePersistance({ mock = {} }: FakePersistanceConfig = {}) {
    const persistance = new MemoryPersistance();

    const _set = persistance.set;
    persistance.set = spy(mock.set ?? _set.bind(persistance));

    const _get = persistance.get;
    persistance.get = spy(mock.get ?? _get.bind(persistance));

    const _delete = persistance.delete;
    persistance.delete = spy(mock.delete ?? _delete.bind(persistance));

    return persistance;
}
