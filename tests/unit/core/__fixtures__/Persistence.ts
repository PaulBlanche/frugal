import {
    NotFound,
    Persistence,
} from '../../../../packages/core/Persistence.ts';
import { spy } from '../../../../dep/std/testing/mock.ts';

class MemoryPersistence implements Persistence {
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

type FakePersistenceConfig = {
    mock?: {
        set?: Persistence['set'];
        get?: Persistence['get'];
        delete?: Persistence['delete'];
    };
};

export function fakePersistence({ mock = {} }: FakePersistenceConfig = {}) {
    const persistence = new MemoryPersistence();

    const _set = persistence.set;
    persistence.set = spy(mock.set ?? _set.bind(persistence));

    const _get = persistence.get;
    persistence.get = spy(mock.get ?? _get.bind(persistence));

    const _delete = persistence.delete;
    persistence.delete = spy(mock.delete ?? _delete.bind(persistence));

    return persistence;
}
