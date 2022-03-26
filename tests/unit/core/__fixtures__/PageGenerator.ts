import {
    PageGenerator,
    PageGeneratorConfig,
} from '../../../../packages/core/PageGenerator.ts';
import { Page } from '../../../../packages/core/Page.ts';
import { fakeDynamicPage } from './Page.ts';
import { fakeLoaderContext } from './LoaderContext.ts';
import { spy } from '../../../test_util/mod.ts';

type FakePageGeneratorConfig<REQUEST extends object, DATA> = {
    page?: Page<REQUEST, DATA>;
    config?: PageGeneratorConfig;
    mock?: {
        match?: PageGenerator<REQUEST, DATA>['match'];
        generate?: PageGenerator<REQUEST, DATA>['generate'];
        generateContentFromData?: PageGenerator<
            REQUEST,
            DATA
        >['generateContentFromData'];
    };
};

export function fakePageGenerator<REQUEST extends object, DATA>(
    {
        page = fakeDynamicPage(),
        config = {
            loaderContext: fakeLoaderContext(),
            publicDir: '',
        },
        mock = {},
    }: FakePageGeneratorConfig<REQUEST, DATA> = {},
) {
    const generator = new PageGenerator<REQUEST, DATA>(page, config);

    const originalMatch = generator.match;
    generator.match = spy(mock.match ?? originalMatch.bind(generator));

    const originalGenerate = generator.generate;
    generator.generate = spy(mock.generate ?? originalGenerate.bind(generator));

    const originalGenerateContentFromData = generator.generateContentFromData;
    generator.generateContentFromData = spy(
        mock.generateContentFromData ??
            originalGenerateContentFromData.bind(generator),
    );

    return generator;
}
