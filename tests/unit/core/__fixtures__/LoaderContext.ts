import { LoaderContext } from '../../../../packages/core/LoaderContext.ts';
import { spy } from '../../../../dep/std/mock.ts';

type FakeLoaderContextConfig = {
    context?: Record<string, any>;
    mock?: {
        save?: LoaderContext['save'];
        get?: LoaderContext['get'];
    };
};

export function fakeLoaderContext(
    { context = {}, mock = {} }: FakeLoaderContextConfig = {},
) {
    const loaderContext = new LoaderContext(context);

    const originalSave = loaderContext.save;
    loaderContext.save = spy(mock.save ?? originalSave.bind(loaderContext));

    const originalGet = loaderContext.get;
    loaderContext.get = spy(mock.get ?? originalGet.bind(loaderContext));

    return loaderContext;
}
