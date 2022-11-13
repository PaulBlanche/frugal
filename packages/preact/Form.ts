import { Session } from '../client_session/mod.ts';

export type FieldValue = string | File;

export type FieldState<VALUE extends FieldValue> = {
    value: VALUE;
    errors: string[];
    dirty: boolean;
    touched: boolean;
};

export type FormValue = Record<string, FieldValue>;

export type FormState<VALUE extends FormValue> = {
    fields: {
        [K in keyof VALUE]: FieldState<VALUE[K]>;
    };
    valid: boolean;
    submitCounter: number;
    isValidating: boolean;
    isSubmiting: boolean;
    success: boolean;
};

export type ValidationResult<VALUE> =
    | { success: true }
    | {
        success: false;
        errors: Partial<{ [K in keyof VALUE]: string[] }>;
    };

export type ValidationStrategy<VALUE extends FormValue> = (
    event: 'change' | 'touch' | 'submit',
    submitCounter: number,
    validate: () => Promise<ValidationResult<VALUE>>,
) => Promise<ValidationResult<VALUE>>;

export type FormConfig<VALUE extends FormValue> = {
    initialValue: VALUE;
    validate(
        value: VALUE,
    ): Promise<ValidationResult<VALUE>> | ValidationResult<VALUE>;
    handleSubmit(
        value: VALUE,
        form: Form<VALUE>,
    ): Promise<ValidationResult<VALUE>> | ValidationResult<VALUE>;
    validationStrategy?: ValidationStrategy<VALUE>;
};

type Listener = () => void;

export function defaultValidationStrategy<VALUE extends FormValue>(
    event: 'change' | 'touch' | 'submit',
    submitCounter: number,
    validate: () => Promise<ValidationResult<VALUE>>,
): Promise<ValidationResult<VALUE>> {
    switch (event) {
        case 'submit': { // validation on submit
            return validate();
        }
        case 'change':
        case 'touch': { // validate after first submit
            if (submitCounter > 0) {
                return validate();
            } else {
                return Promise.resolve({ success: true });
            }
        }
    }
}

// deno-lint-ignore no-explicit-any
export class Form<VALUE extends FormValue = any> {
    #state: FormState<VALUE>;
    #config: FormConfig<VALUE>;
    #listeners: Listener[];

    static fromState<VALUE extends FormValue>(
        config: FormConfig<VALUE>,
        state: FormState<VALUE>,
    ): Form<VALUE> {
        return new Form(config, state);
    }

    static fromValue<VALUE extends FormValue>(
        config: FormConfig<VALUE>,
        value?: VALUE,
    ): Form<VALUE> {
        return new Form(config, formState(config.initialValue, value));
    }

    constructor(config: FormConfig<VALUE>, state: FormState<VALUE>) {
        this.#config = config;
        this.#listeners = [];
        this.#state = state;
    }

    addListener(listener: Listener) {
        this.#listeners.push(listener);
    }

    removeListener(listener: Listener) {
        const listenerIndex = this.#listeners.indexOf(listener);
        if (listenerIndex !== -1) {
            this.#listeners.splice(listenerIndex, 1);
        }
    }

    _dispatch() {
        this.#listeners.forEach((listener) => listener());
    }

    async validate(): Promise<ValidationResult<VALUE>> {
        this.#state.isValidating = true;
        this._dispatch();

        const result = await this.#config.validate(this.value);

        this.#state.valid = result.success;

        if (!result.success) {
            for (const [key, errors] of entries(result.errors)) {
                new Field(this.#state.fields[key]).errors = errors ?? [];
            }
        } else {
            for (const [key, _field] of entries(this.#state.fields)) {
                new Field(this.#state.fields[key]).errors = [];
            }
        }

        for (const [_key, field] of entries(this.#state.fields)) {
            new Field(field).touch();
        }

        this.#state.isValidating = false;
        this._dispatch();

        return result;
    }

    reset() {
        this.#state = formState(this.#config.initialValue);
    }

    async submit(formElement: HTMLFormElement): Promise<void> {
        this.#state.submitCounter += 1;
        const validationResult = await this._validationStrategy('submit');

        if (!validationResult.success) {
            return;
        }

        this.#state.isSubmiting = true;
        this._dispatch();

        await Session.getInstance().navigate(formElement.action, {
            method: 'POST',
            body: new FormData(formElement),
        });
    }

    async handle(): Promise<VALUE | undefined> {
        this.#state.submitCounter += 1;
        const validationResult = await this._validationStrategy('submit');

        if (!validationResult.success) {
            return;
        }

        this.#state.isSubmiting = true;
        this._dispatch();

        const value = this.value;
        const submitResult = await this.#config.handleSubmit(this.value, this);

        this.#state.valid = submitResult.success;
        this.#state.success = submitResult.success;

        if (!submitResult.success) {
            for (const [key, errors] of entries(submitResult.errors)) {
                new Field(this.#state.fields[key]).errors = errors ?? [];
            }
        }

        this.#state.isSubmiting = false;
        this._dispatch();

        return this.success ? value : undefined;
    }

    field<KEY extends keyof VALUE>(key: KEY): Field<VALUE[KEY]> {
        return new Field(this.#state.fields[key], this);
    }

    get value() {
        return valueOf(this.#state);
    }

    get valid() {
        return this.#state.valid;
    }

    get submitCounter() {
        return this.#state.submitCounter;
    }

    get isSubmiting() {
        return this.#state.isSubmiting;
    }

    get isValidating() {
        return this.#state.isValidating;
    }

    get state() {
        return this.#state;
    }

    get success() {
        return this.#state.success;
    }

    _validationStrategy(event: 'change' | 'touch' | 'submit') {
        return (this.#config.validationStrategy ?? defaultValidationStrategy)(
            event,
            this.submitCounter,
            () => this.validate(),
        );
    }
}

class Field<VALUE extends FieldValue> {
    #state: FieldState<VALUE>;
    #form?: Form;

    constructor(state: FieldState<VALUE>, form?: Form) {
        this.#state = state;
        this.#form = form;
    }

    get value() {
        return this.#state.value;
    }

    set value(value: VALUE) {
        this.#state.dirty = this.#state.dirty || value !== this.#state.value;
        this.#state.touched = this.#state.touched ||
            value !== this.#state.value;
        this.#state.value = value;
        this.#form && this.#form._dispatch();
        this.#form && this.#form._validationStrategy('change');
    }

    get errors() {
        return this.#state.errors;
    }

    set errors(errors: string[]) {
        this.#state.errors = errors;
        this.#form && this.#form._dispatch();
    }

    get dirty() {
        return this.#state.dirty;
    }

    get touched() {
        return this.#state.touched;
    }

    touch() {
        this.#state.touched = true;
        this.#form && this.#form._validationStrategy('touch');
    }
}

// deno-lint-ignore no-explicit-any
function entries<VALUE extends Record<string, any>>(
    value: VALUE,
): [keyof VALUE, VALUE[keyof VALUE]][] {
    return Object.entries(value);
}

function formState<VALUE extends FormValue>(
    initialValue: VALUE,
    currentValue?: VALUE,
): FormState<VALUE> {
    const formState = {
        fields: {},
        isSubmiting: false,
        isValidating: false,
        valid: true,
        submitCounter: 0,
        success: false,
    } as FormState<VALUE>;
    for (const [key, value] of entries(initialValue)) {
        formState.fields[key] = initialFieldState(value);
    }

    if (currentValue) {
        for (const [key, value] of entries(currentValue)) {
            formState.fields[key].value = value;
        }
    }
    return formState;
}

function valueOf<VALUE extends FormValue>(
    formState: FormState<VALUE>,
): VALUE {
    return entries(formState.fields).reduce((value, [key, field]) => {
        value[key] = field.value;
        return value;
    }, {} as VALUE);
}

function initialFieldState<VALUE extends FieldValue>(
    value: VALUE,
): FieldState<VALUE> {
    return {
        value,
        errors: [],
        dirty: false,
        touched: true,
    };
}
