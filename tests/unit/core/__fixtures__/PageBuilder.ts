import {
    PageBuilder,
    PageBuilderConfig,
} from '../../../../packages/core/PageBuilder.ts';
import { Page } from '../../../../packages/core/Page.ts';
import { PageGenerator } from '../../../../packages/core/PageGenerator.ts';
import { fakePageGenerator } from './PageGenerator.ts';
import { fakeStaticPage } from './Page.ts';
import { fakeCache } from './Cache.ts';
import { fakePersistance } from './Persistance.ts';
import { spy } from '../../../../dep/std/mock.ts';

type FakePageBuilderConfig<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
> = {
    page?: Page<PATH, DATA>;
    hash?: string;
    generator?: PageGenerator<PATH, DATA>;
    config?: PageBuilderConfig;
    mock?: {
        build?: PageBuilder<PATH, DATA>['build'];
        buildAll?: PageBuilder<PATH, DATA>['buildAll'];
    };
};

export function fakePageBuilder<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
>(
    {
        page = fakeStaticPage(),
        hash = '',
        generator = fakePageGenerator(),
        config = {
            cache: fakeCache(),
            persistance: fakePersistance(),
        },
        mock = {},
    }: FakePageBuilderConfig<PATH, DATA> = {},
) {
    const builder = new PageBuilder<PATH, DATA>(
        page,
        hash,
        generator,
        config,
    );

    const originalBuild = builder.build;
    builder.build = spy(mock.build ?? originalBuild.bind(builder));

    const originalBuildAll = builder.buildAll;
    builder.buildAll = spy(mock.buildAll ?? originalBuildAll.bind(builder));

    return builder;
}
