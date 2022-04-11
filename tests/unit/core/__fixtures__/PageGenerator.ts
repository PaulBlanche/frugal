import {
    PageGenerator,
    PageGeneratorConfig,
} from '../../../../packages/core/PageGenerator.ts';
import { Page } from '../../../../packages/core/Page.ts';
import { fakeDynamicPage } from './Page.ts';
import { fakeLoaderContext } from './LoaderContext.ts';
import { spy } from '../../../test_util/mod.ts';

type FakePageGeneratorConfig<REQUEST extends object, DATA, POST_BODY> = {
    page?: Page<REQUEST, DATA, POST_BODY>;
    config?: PageGeneratorConfig;
    mock?: {
        match?: PageGenerator<REQUEST, DATA, POST_BODY>['match'];
        generate?: PageGenerator<REQUEST, DATA, POST_BODY>['generate'];
        generateContentFromData?: PageGenerator<
            REQUEST,
            DATA,
            POST_BODY
        >['generateContentFromData'];
    };
};

export function fakePageGenerator<REQUEST extends object, DATA, POST_BODY>(
    {
        page = fakeDynamicPage(),
        config = {
            loaderContext: fakeLoaderContext(),
            publicDir: '',
        },
        mock = {},
    }: FakePageGeneratorConfig<REQUEST, DATA, POST_BODY> = {},
) {
    const generator = new PageGenerator<REQUEST, DATA, POST_BODY>(page, config);

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
