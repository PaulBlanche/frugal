import {
    PageGenerator,
    PageGeneratorConfig,
} from '../../../../packages/core/PageGenerator.ts';
import { Page } from '../../../../packages/core/Page.ts';
import { fakeDynamicPage } from './Page.ts';
import { fakeLoaderContext } from './LoaderContext.ts';
import { spy } from '../../../../dep/std/testing/mock.ts';

type FakePageGeneratorConfig<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
> = {
    page?: Page<PATH, DATA>;
    config?: PageGeneratorConfig;
    mock?: {
        generate?: PageGenerator<PATH, DATA>['generate'];
        generateContentFromData?: PageGenerator<
            PATH,
            DATA
        >['generateContentFromData'];
        getPagePath?: PageGenerator<PATH, DATA>['getPagePath'];
    };
};

export function fakePageGenerator<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
>(
    {
        page = fakeDynamicPage(),
        config = {
            loaderContext: fakeLoaderContext(),
            publicDir: '',
        },
        mock = {},
    }: FakePageGeneratorConfig<PATH, DATA> = {},
) {
    const generator = new PageGenerator<PATH, DATA>(page, config);

    const originalGenerate = generator.generate;
    generator.generate = spy(mock.generate ?? originalGenerate.bind(generator));

    const originalGenerateContentFromData = generator.generateContentFromData;
    generator.generateContentFromData = spy(
        mock.generateContentFromData ??
            originalGenerateContentFromData.bind(generator),
    );

    const originalGetPagePath = generator.getPagePath;
    generator.getPagePath = spy(
        mock.getPagePath ?? originalGetPagePath.bind(generator),
    );

    return generator;
}
