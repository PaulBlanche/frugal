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

type FakePageBuilderConfig<REQUEST extends object, DATA, POST_BODY> = {
    page?: Page<REQUEST, DATA, POST_BODY>;
    hash?: string;
    generator?: PageGenerator<REQUEST, DATA, POST_BODY>;
    config?: PageBuilderConfig;
    mock?: {
        build?: PageBuilder<REQUEST, DATA, POST_BODY>['build'];
        buildAll?: PageBuilder<REQUEST, DATA, POST_BODY>['buildAll'];
    };
};

export function fakePageBuilder<REQUEST extends object, DATA, POST_BODY>(
    {
        page = fakeStaticPage(),
        hash = '',
        generator = fakePageGenerator(),
        config = {
            cache: fakeCache(),
            persistance: fakePersistance()
        },
        mock = {},
    }: FakePageBuilderConfig<REQUEST, DATA, POST_BODY> = {},
) {
    const builder = new PageBuilder<REQUEST, DATA, POST_BODY>(
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
