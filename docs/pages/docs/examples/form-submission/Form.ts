import {
    Form,
    FormConfig,
    FormState,
    ValidationResult,
} from '../../../../dep/frugal/preact.client.ts';

export type Value = {
    age: string;
    username: string;
    csrftoken: string;
};

export const CONFIG: FormConfig<Value> = {
    initialValue: {
        age: '',
        username: '',
        csrftoken: '',
    },
    validate,
    handleSubmit,
};

export function initial(csrftoken: string): Form<Value> {
    return Form.fromValue({
        ...CONFIG,
        initialValue: {
            ...CONFIG.initialValue,
            csrftoken,
        },
    });
}

export function fromFormData(
    formData: FormData,
    csrftoken: string,
): Form<Value> {
    const ageField = formData.get('age');
    const usernameField = formData.get('username');

    return Form.fromValue(CONFIG, {
        age: typeof ageField === 'string' ? ageField : '',
        username: typeof usernameField === 'string' ? usernameField : '',
        csrftoken,
    });
}

export function fromState(state: FormState<Value>): Form<Value> {
    return Form.fromState(CONFIG, state);
}

function validateAge(age: Value['age']): string[] {
    const errors = [];
    const ageAsNumber = Number(age);
    if (isNaN(ageAsNumber)) {
        errors.push('Age must be a number');
    }
    if (ageAsNumber < 18) {
        errors.push('Age must be greater than 18 or more');
    }
    return errors;
}

function validateUsername(username: Value['username']): string[] {
    const errors = [];
    if (username.length < 3) {
        errors.push('Username is too short (min 3 characters)');
    }
    if (username.length > 10) {
        errors.push('Username is too long (max 15 characters)');
    }
    return errors;
}

function validate(value: Value): ValidationResult<Value> {
    const errors = {
        age: validateAge(value.age),
        username: validateUsername(value.username),
    };

    const success = errors.age.length === 0 && errors.username.length === 0;

    if (!success) {
        return {
            success: false,
            errors,
        };
    }

    return { success: true };
}

async function handleSubmit(
    _value: Value,
    _form: Form<Value>,
): Promise<ValidationResult<Value>> {
    await new Promise((res) => setTimeout(res, 50 + 100 * Math.random()));
    return { success: true };
}
