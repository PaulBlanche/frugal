import {
    PageBuilder,
    PageBuilderConfig,
} from '../../../../packages/core/PageBuilder.ts';
import { Page } from '../../../../packages/core/Page.ts';
import { PageGenerator } from '../../../../packages/core/PageGenerator.ts';
import { fakePageGenerator } from './PageGenerator.ts';
import { fakeStaticPage } from './Page.ts';
import { fakeCache } from './Cache.ts';
import { spy } from '../../../test_util/mod.ts';

type FakePageBuilderConfig<REQUEST extends object, DATA> = {
    page?: Page<REQUEST, DATA>;
    hash?: string;
    generator?: PageGenerator<REQUEST, DATA>;
    config?: PageBuilderConfig;
    mock?: {
        build?: PageBuilder<REQUEST, DATA>['build'];
        buildAll?: PageBuilder<REQUEST, DATA>['buildAll'];
    };
};

export function fakePageBuilder<REQUEST extends object, DATA>(
    {
        page = fakeStaticPage(),
        hash = '',
        generator = fakePageGenerator(),
        config = {
            cache: fakeCache(),
        },
        mock = {},
    }: FakePageBuilderConfig<REQUEST, DATA> = {},
) {
    const builder = new PageBuilder<REQUEST, DATA>(
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
