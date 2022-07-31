import * as murmur from '../murmur/mod.ts';

const SCOPED_CLASSNAMES = new Set<string>();
const RULES: Rules[] = [];
const GLOBAL_STYLES: string[] = [];
const KEYFRAME_NAMES = new Set<string>();
const KEYFRAMES: KeyFrames[] = [];

/**
 * Base class for a css rules
 */
export class Rules {
    /** the css of this rule */
    properties: string;
    /** the className of this rule */
    className: string;
    /** the selector of this rule (derived from `className`) */
    selector: string;

    constructor(className: string, properties: string) {
        this.properties = properties;
        this.className = className;
        this.selector = `.${className}`;
    }

    /**
     * generates the string css of the rule
     */
    toCss() {
        return `${this.selector}{${this.properties}}`;
    }

    toCssComment() {
        return this.toCss();
    }
}

/**
 * Scoped css rule, garanteed to never clash with another selector.
 */
export class ScopedRules extends Rules {
    /** list of rules this rule extends */
    parents: ScopedRules[];
    /** the concatenated css of this rules and its parents */
    css: string;
    /** the concatenation of the className of this rule and its parents */
    className: string;

    constructor(hint: string, properties: string, parents: ScopedRules[]) {
        const hash = new murmur.Hash().update(hint).update(properties);
        parents.forEach((rule) => {
            hash.update(rule.className);
        });

        const ownClassName = `${hint || 'c'}-${hash.digest()}`;

        super(ownClassName, properties);

        this.className = cx(
            ownClassName,
            ...parents.map((parent) => parent.className),
        );
        this.parents = parents;

        const parentCss = parents.map((parent) => parent.css).join('\n');
        if (parentCss.length !== 0) {
            this.css = `${parentCss}\n${this.properties}`;
        } else {
            this.css = this.properties;
        }
    }

    toCssComment() {
        return `${this.parents.map((parent) => parent.toCss()).join('\n')}${
            this.parents.length !== 0 ? '\n' : ''
        }${this.toCss()}`;
    }
}

export class KeyFrames {
    name: string;
    css: string;

    constructor(properties: string) {
        const hash = new murmur.Hash().update(properties);

        this.name = `a-${hash.digest()}`;
        this.css = properties;
    }

    toCss() {
        return `@keyframes ${this.name} {${this.css}}`;
    }
}

type Interpolable = string | number | Rules | KeyFrames;

/**
 * Rules and KeyFrames aware tagged template :
 *  - Rules interpolations are replaced with their selectors
 *  - KeyFrames interpolations are replaced with their names
 */
export function css(
    template: TemplateStringsArray,
    ...interpolations: Interpolable[]
): string {
    const propertyList: string[] = [template[0]];

    interpolations.forEach((interpolation, i) => {
        propertyList.push(
            interpolation instanceof Rules
                ? interpolation.selector
                : interpolation instanceof KeyFrames
                ? interpolation.name
                : String(interpolation),
        );
        propertyList.push(template[i + 1]);
    });

    return propertyList.join('');
}

/**
 * Wrapper around ScopedRules to expose a `styled` tagged template
 */
export class ScopedClassName {
    hint: string;
    parents: ScopedRules[];

    constructor(hint: string = '') {
        this.hint = hint;
        this.parents = [];
    }

    /**
     * declare that the current ScopedRules extends some other ScopedRules
     */
    extends(...parents: ScopedRules[]) {
        this.parents = parents;
        return this;
    }

    /**
     * a Rules and KeyFrames aware tagged template returning a ScopedRules. The
     * generated className is garanteed to be unique.
     */
    styled(
        template: TemplateStringsArray,
        ...interpolations: Interpolable[]
    ) {
        const properties = css(template, ...interpolations);
        const rule = new ScopedRules(this.hint, properties, this.parents);
        if (!SCOPED_CLASSNAMES.has(rule.className)) {
            RULES.push(rule);
            SCOPED_CLASSNAMES.add(rule.className);
        }
        return rule;
    }
}

/**
 * create a ScopedClassName
 */
export function className(hint: string) {
    return new ScopedClassName(hint);
}

/**
 * Wrapper around Rules to expose a `styled` tagged template
 */
export class GlobalClassName {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    /**
     * a Rules and KeyFrames aware tagged template returning a Rules. The
     * generated className might NOT be unique.
     */
    styled(
        template: TemplateStringsArray,
        ...interpolations: Interpolable[]
    ) {
        const properties = css(template, ...interpolations);
        const rule = new Rules(this.name, properties);
        RULES.push(rule);

        return rule;
    }
}

/**
 * create a GlobalClassName
 */
export function globalClassName(name: string) {
    return new GlobalClassName(name);
}

/**
 * create some global styles
 */
export function createGlobalStyle(
    template: TemplateStringsArray,
    ...interpolations: Interpolable[]
) {
    const properties = css(template, ...interpolations);
    GLOBAL_STYLES.push(properties);
}

/**
 * create a KeyFrame
 */
export function keyframes(
    template: TemplateStringsArray,
    ...interpolations: Interpolable[]
): KeyFrames {
    const properties = css(template, ...interpolations);
    const keyframes = new KeyFrames(properties);
    if (!KEYFRAME_NAMES.has(keyframes.name)) {
        KEYFRAMES.push(keyframes);
        KEYFRAME_NAMES.add(keyframes.name);
    }
    return keyframes;
}

type CXPrimitives =
    | string
    | number
    | boolean
    | undefined
    | null
    | Record<string, unknown>
    | Rules;
type CX = CXPrimitives | CX[];

/**
 * generates a className string from a list of string and Rules. This function
 * is able to skip "empty" values (`undefined` or `null`). This function also
 * handle booleans, enabling constructs like `boolean && rule`.
 */
export function cx(
    ...classNames: CX[]
): string {
    return classNames
        .map((name) => {
            if (Array.isArray(name)) {
                return cx(...name);
            }

            if (
                typeof name === 'object' && name !== null &&
                !(name instanceof Rules)
            ) {
                return Object.entries(name).reduce<string[]>(
                    (classNames, [name, value]) => {
                        if (value) {
                            classNames.push(name);
                        }
                        return classNames;
                    },
                    [],
                ).join(' ');
            }

            return name;
        })
        .filter((name) =>
            Boolean(name) && (name instanceof Rules ||
                typeof name === 'string' ||
                typeof name === 'number')
        )
        .map((name) => {
            if (name instanceof Rules) return name.className;
            return name;
        }).join(' ');
}

export function clean() {
    SCOPED_CLASSNAMES.clear();
    RULES.length = 0;
    GLOBAL_STYLES.length = 0;
    KEYFRAME_NAMES.clear();
    KEYFRAMES.length = 0;
}

/**
 * output the full stylesheet from all the rules (scoped or not), global rules
 * and keyframes that where registered so far
 */
export function output(): string {
    const keyframes = KEYFRAMES.map((keyframes) => keyframes.toCss()).join(
        '\n',
    );
    const globalStyles = GLOBAL_STYLES.join('\n');
    const rules = RULES.map((rule) => rule.toCss()).join('\n');
    return `${keyframes}\n${globalStyles}\n${rules}`;
}
