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

type FakePageBuilderConfig<REQUEST extends object, DATA, BODY> = {
    page?: Page<REQUEST, DATA, BODY>;
    hash?: string;
    generator?: PageGenerator<REQUEST, DATA, BODY>;
    config?: PageBuilderConfig;
    mock?: {
        build?: PageBuilder<REQUEST, DATA, BODY>['build'];
        buildAll?: PageBuilder<REQUEST, DATA, BODY>['buildAll'];
    };
};

export function fakePageBuilder<REQUEST extends object, DATA, BODY>(
    {
        page = fakeStaticPage(),
        hash = '',
        generator = fakePageGenerator(),
        config = {
            cache: fakeCache(),
            persistance: fakePersistance(),
        },
        mock = {},
    }: FakePageBuilderConfig<REQUEST, DATA, BODY> = {},
) {
    const builder = new PageBuilder<REQUEST, DATA, BODY>(
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
