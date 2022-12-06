import { LoaderContext } from '../../../../packages/core/LoaderContext.ts';
import { spy } from '../../../../dep/std/testing/mock.ts';
import { Persistence } from '../../../../packages/core/Persistence.ts';
import { fakePersistence } from './Persistence.ts';

type FakeLoaderContextConfig = {
    context?: Record<string, any>;
    persistence?: Persistence;
    mock?: {
        save?: LoaderContext['save'];
        get?: LoaderContext['get'];
    };
};

export function fakeLoaderContext(
    { context = {}, persistence = fakePersistence(), mock = {} }:
        FakeLoaderContextConfig = {},
) {
    const loaderContext = new LoaderContext(context, persistence);

    const originalSave = loaderContext.save;
    loaderContext.save = spy(mock.save ?? originalSave.bind(loaderContext));

    const originalGet = loaderContext.get;
    loaderContext.get = spy(mock.get ?? originalGet.bind(loaderContext)) as any;

    return loaderContext;
}
