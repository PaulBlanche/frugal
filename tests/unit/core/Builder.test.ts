import { fakeConfig } from './__fixtures__/Config.ts';
import { Builder } from '../../../packages/core/Builder.ts';
import { fakePageBuilder } from './__fixtures__/PageBuilder.ts';
import { asSpy } from '../../test_util/mod.ts';
import * as asserts from '../../../dep/std/asserts.ts';

Deno.test('Builder: setup build logging', async () => {
    const config = fakeConfig();

    const builder = new Builder(config, []);

    await builder.build();

    asserts.assertEquals(asSpy(config.setupBuildLogging).calls.length, 1);
});

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

    asserts.assertEquals(asSpy(pageBuilders[0].buildAll).calls.length, 1);
    asserts.assertEquals(asSpy(pageBuilders[0].buildAll).calls.length, 1);
});
