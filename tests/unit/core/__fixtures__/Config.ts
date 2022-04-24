import {
    CleanConfig,
    Config,
    OFF_LOGGER_CONFIG,
} from '../../../../packages/core/Config.ts';
import * as importmap from '../../../../dep/importmap.ts';

type FakeCleanConfigConfig = Partial<
Omit<Config, 'importMap'> & { importMap: importmap.ImportMap }
> & {
    mock?: {};
};

export function fakeConfig(
    {
        self = new URL('file:///'),
        root,
        importMap = {},
        loaders,
        outputDir = '',
        pages = [],
        logging = OFF_LOGGER_CONFIG,
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

    return config;
}
