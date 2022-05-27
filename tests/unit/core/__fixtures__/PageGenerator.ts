import {
    PageGenerator,
    PageGeneratorConfig,
} from '../../../../packages/core/PageGenerator.ts';
import { Page } from '../../../../packages/core/Page.ts';
import { fakeDynamicPage } from './Page.ts';
import { fakeLoaderContext } from './LoaderContext.ts';
import { spy } from '../../../../dep/std/mock.ts';

type FakePageGeneratorConfig<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
> = {
    page?: Page<PATH, DATA, BODY>;
    config?: PageGeneratorConfig;
    mock?: {
        generate?: PageGenerator<PATH, DATA, BODY>['generate'];
        generateContentFromData?: PageGenerator<
            PATH,
            DATA,
            BODY
        >['generateContentFromData'];
    };
};

export function fakePageGenerator<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
>(
    {
        page = fakeDynamicPage(),
        config = {
            loaderContext: fakeLoaderContext(),
            publicDir: '',
        },
        mock = {},
    }: FakePageGeneratorConfig<PATH, DATA, BODY> = {},
) {
    const generator = new PageGenerator<PATH, DATA, BODY>(page, config);

    const originalGenerate = generator.generate;
    generator.generate = spy(mock.generate ?? originalGenerate.bind(generator));

    const originalGenerateContentFromData = generator.generateContentFromData;
    generator.generateContentFromData = spy(
        mock.generateContentFromData ??
            originalGenerateContentFromData.bind(generator),
    );

    return generator;
}
