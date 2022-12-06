import {
    PageBuilder,
    PageBuilderConfig,
} from '../../../../packages/core/PageBuilder.ts';
import { Page } from '../../../../packages/core/Page.ts';
import { PageGenerator } from '../../../../packages/core/PageGenerator.ts';
import { fakePageGenerator } from './PageGenerator.ts';
import { fakeStaticPage } from './Page.ts';
import { fakeCache } from './Cache.ts';
import { fakePersistence } from './Persistence.ts';
import { stub } from '../../../../dep/std/testing/mock.ts';

type FakePageBuilderConfig<DATA = unknown, PATH extends string = string> = {
    page?: Page<DATA, PATH>;
    hash?: string;
    generator?: PageGenerator<DATA, PATH>;
    config?: PageBuilderConfig;
    mock?: {
        build?: PageBuilder<DATA, PATH>['build'];
        buildAll?: PageBuilder<DATA, PATH>['buildAll'];
    };
};

export function fakePageBuilder<DATA = unknown, PATH extends string = string>(
    {
        page = fakeStaticPage(),
        hash = '',
        generator = fakePageGenerator(),
        config = {
            cache: fakeCache(),
            persistence: fakePersistence(),
        },
        mock = {},
    }: FakePageBuilderConfig<DATA, PATH> = {},
) {
    const builder = new PageBuilder<DATA, PATH>(
        page,
        hash,
        generator,
        config,
    );

    for (
        const prop of [
            'build',
            'buildAll',
        ]
    ) {
        const property = prop as keyof typeof mock;
        stub(builder, property, (mock[property] as any) ?? builder[property]);
    }

    return builder;
}
