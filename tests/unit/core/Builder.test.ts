import { fakeConfig } from './__fixtures__/Config.ts';
import { Builder } from '../../../packages/core/Builder.ts';
import { fakePageBuilder } from './__fixtures__/PageBuilder.ts';
import { assertSpyCalls } from '../../../dep/std/mock.ts';
import { asSpy } from '../../test_util/mod.ts';

Deno.test('Builder: delegates to underlying PageBuilders', async () => {
    const config = fakeConfig();

    const pageBuilders = [
        fakePageBuilder({
            mock: {
                buildAll: () => Promise.resolve(),
            },
        }),
        fakePageBuilder({
            mock: {
                buildAll: () => Promise.resolve(),
            },
        }),
    ];
    const builder = new Builder(config, pageBuilders);

    await builder.build();

    assertSpyCalls(asSpy(pageBuilders[0].buildAll), 1)
    assertSpyCalls(asSpy(pageBuilders[1].buildAll), 1)
});
