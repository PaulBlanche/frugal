import * as asserts from '../../../dep/std/testing/asserts.ts';
import {
    assertSpyCall,
    assertSpyCalls,
    spy,
} from '../../../dep/std/testing/mock.ts';
import {
    className,
    clean,
    createGlobalStyle,
    css,
    cx,
    GlobalClassName,
    globalClassName,
    KeyFrames,
    keyframes,
    output,
    Rules,
    ScopedClassName,
    ScopedRules,
} from '../../../packages/loader_style/styled.ts';

Deno.test('styled: Rule generate the expected css and className', () => {
    const className = 'className';
    const properties = 'properties';
    const rules = new Rules(className, properties);

    asserts.assertEquals(rules.selector, `.${className}`);
    asserts.assertEquals(rules.toCss(), `.${className}{${properties}}`);
});

Deno.test('styled: ScopedRule generate the expected css and className', async (t) => {
    const properties = 'properties';

    await t.step('ScopedRule without hint', () => {
        const rules = new ScopedRules('', properties, []);

        asserts.assertEquals(rules.selector, '.c-r1bvic');
        asserts.assertEquals(rules.toCss(), `.c-r1bvic{${properties}}`);
        asserts.assertEquals(rules.css, properties);
        asserts.assertEquals(rules.className, 'c-r1bvic');
    });

    await t.step('ScopedRule with hint', () => {
        const rules = new ScopedRules('hint', properties, []);

        asserts.assertEquals(rules.selector, '.hint-7tuhgg');
        asserts.assertEquals(rules.toCss(), `.hint-7tuhgg{${properties}}`);
        asserts.assertEquals(rules.css, properties);
        asserts.assertEquals(rules.className, 'hint-7tuhgg');
    });

    await t.step('ScopedRule with parent', () => {
        const parent1 = new ScopedRules('parent1', 'parent1', []);
        const parent2 = new ScopedRules('parent2', 'parent1', []);
        const rules = new ScopedRules('hint', properties, [parent1, parent2]);

        asserts.assertEquals(rules.selector, '.hint-15ij1xx');
        asserts.assertEquals(rules.toCss(), `.hint-15ij1xx{${properties}}`);
        asserts.assertEquals(
            rules.css,
            `${parent1.css}\n${parent2.css}\nproperties`,
        );
        asserts.assertEquals(
            rules.className,
            `hint-15ij1xx ${parent1.className} ${parent2.className}`,
        );
    });
});

Deno.test('styled: KeyFrames', () => {
    const properties = 'properties';
    const keyframes = new KeyFrames(properties);

    asserts.assertEquals(keyframes.css, properties);
    asserts.assertEquals(keyframes.name, `a-r1bvic`);
});

Deno.test('styled: css interpolation', () => {
    const rules = new Rules('hint', 'rule-properties');
    const keyframes = new KeyFrames('keyframes-properties');

    const generated =
        css`s1 ${'string'} s2 ${12} s3 ${rules} s4 ${keyframes} s5`;
    asserts.assertEquals(
        generated,
        `s1 string s2 12 s3 ${rules.selector} s4 ${keyframes.name} s5`,
    );
});

Deno.test('styled: ScopedClassName', () => {
    const parent1 = new ScopedRules('parent1', 'parent1', []);
    const parent2 = new ScopedRules('parent2', 'parent1', []);
    const scopedClassname = new ScopedClassName('hint');
    scopedClassname.extends(parent1, parent2);
    const rules = scopedClassname
        .styled`s1 ${'string'} s2 ${12} s3 ${parent1} s4`;
    const expectedRules = new ScopedRules(
        'hint',
        css`s1 ${'string'} s2 ${12} s3 ${parent1} s4`,
        [parent1, parent2],
    );

    asserts.assertEquals(rules.className, expectedRules.className);
    asserts.assertEquals(rules.css, expectedRules.css);
    asserts.assertEquals(rules.properties, expectedRules.properties);
    asserts.assertEquals(rules.selector, expectedRules.selector);
    asserts.assertEquals(rules.toCss(), expectedRules.toCss());
});

Deno.test('styled: GlobalClassName', () => {
    const otherRules = new Rules('className', 'content');
    const scopedClassname = new GlobalClassName('className');
    const rules = scopedClassname
        .styled`s1 ${'string'} s2 ${12} s3 ${otherRules} s4`;
    const expectedRules = new Rules(
        'className',
        css`s1 ${'string'} s2 ${12} s3 ${otherRules} s4`,
    );

    asserts.assertEquals(rules.className, expectedRules.className);
    asserts.assertEquals(rules.properties, expectedRules.properties);
    asserts.assertEquals(rules.selector, expectedRules.selector);
    asserts.assertEquals(rules.toCss(), expectedRules.toCss());
});

Deno.test('styled: cx', () => {
    const rules = new Rules('className', 'properties');

    asserts.assertEquals(cx(), '');
    asserts.assertEquals(cx('foo'), 'foo');
    asserts.assertEquals(
        cx('foo', 'bar', 1, null, undefined, true, false, rules),
        'foo bar 1 className',
    );
    asserts.assertEquals(
        cx(['foo', ['bar', 1], [null, undefined, 'baz'], true, false]),
        'foo bar 1 baz',
    );
    asserts.assertEquals(
        cx({ foo: true, bar: 1, baz: 0, barbaz: false, foobar: 'b' }),
        'foo bar foobar',
    );
    asserts.assertEquals(
        cx('foo', 'bar', ['baz', false && 'quux', {
            foobar: true,
            barbaz: false,
        }, [rules]]),
        'foo bar baz foobar className',
    );
});

Deno.test('styled: output', async () => {
    clean();
    globalClassName('rule1').styled`rule1`;
    className('scopedRule1').styled`scopedRule1`;
    keyframes`keyframe1`;
    createGlobalStyle`globalStyle1`;

    globalClassName('rule2').styled`rule2`;
    globalClassName('rule3').styled`rule3`;

    className('scopedRule2').styled`scopedRule2`;
    className('scopedRule3').styled`scopedRule3`;

    keyframes`keyframe2`;
    keyframes`keyframe3`;

    createGlobalStyle`globalStyle2`;
    createGlobalStyle`globalStyle3`;

    asserts.assertEquals(
        await output(),
        `@keyframes a-13x8mt9 {keyframe1}
@keyframes a-5tj3rm {keyframe2}
@keyframes a-1yoy2yb {keyframe3}
globalStyle1
globalStyle2
globalStyle3
.rule1{rule1}
.scopedRule1-15b0tyw{scopedRule1}
.rule2{rule2}
.rule3{rule3}
.scopedRule2-ts0ci8{scopedRule2}
.scopedRule3-1rvgno7{scopedRule3}`,
    );
});
