import {
    PageGenerator,
    PageGeneratorConfig,
} from '../../../../packages/core/PageGenerator.ts';
import { Page } from '../../../../packages/core/Page.ts';
import { fakeDynamicPage } from './Page.ts';
import { fakeLoaderContext } from './LoaderContext.ts';
import { stub } from '../../../../dep/std/testing/mock.ts';

type FakePageGeneratorConfig<DATA = unknown, PATH extends string = string> = {
    page?: Page<DATA, PATH>;
    config?: PageGeneratorConfig;
    mock?: {
        generate?: PageGenerator<DATA, PATH>['generate'];
        generateContentFromData?: PageGenerator<
            DATA,
            PATH
        >['generateContentFromData'];
        getPagePath?: PageGenerator<DATA, PATH>['getPagePath'];
    };
};

export function fakePageGenerator<DATA = unknown, PATH extends string = string>(
    {
        page = fakeDynamicPage(),
        config = {
            loaderContext: fakeLoaderContext(),
            publicDir: '',
            rootDir: '',
        },
        mock = {},
    }: FakePageGeneratorConfig<DATA, PATH> = {},
) {
    const generator = new PageGenerator<DATA, PATH>(page, config);

    for (
        const prop of [
            'generate',
            'generateContentFromData',
            'getPagePath',
        ]
    ) {
        const property = prop as keyof typeof mock;
        stub(
            generator,
            property,
            (mock[property] as any) ?? generator[property],
        );
    }

    return generator;
}
