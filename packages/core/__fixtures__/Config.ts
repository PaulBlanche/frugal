import { CleanConfig, Config, OFF_LOGGER_CONFIG } from '../Config.ts';
import * as importmap from '../../../dep/importmap.ts';
import { spy } from '../../test_util/mod.ts';

type FakeCleanConfigConfig = {
    config?: Partial<
        Omit<Config, 'importMap'> & { importMap: importmap.ImportMap }
    >;
    mock?: {
        setupServerLogging?: CleanConfig['setupServerLogging'];
        setupBuildLogging?: CleanConfig['setupBuildLogging'];
    };
};

export function fakeConfig(
    {
        config: {
            self = new URL('file:///'),
            root,
            importMap = {},
            loaders,
            outputDir = '',
            pages = [],
            logging = OFF_LOGGER_CONFIG,
        } = {},
        mock = {},
    }: FakeCleanConfigConfig = {},
) {
    const config = new CleanConfig({
        self,
        root,
        loaders,
        outputDir,
        pages,
        logging,
    }, importMap);

    const originalSetupServerLogging = config.setupServerLogging;
    config.setupServerLogging = spy(
        mock.setupServerLogging ?? originalSetupServerLogging.bind(config),
    );

    const originalSetupBuildLogging = config.setupBuildLogging;
    config.setupBuildLogging = spy(
        mock.setupBuildLogging ?? originalSetupBuildLogging.bind(config),
    );

    return config;
}
