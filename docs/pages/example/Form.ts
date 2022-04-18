import * as oak from '../../dep/oak.ts';

type Field<VALUE> = {
    value: VALUE;
    errors: string[];
    touched: boolean;
    dirty: boolean;
};

export type Form = {
    age: Field<string>;
    username: Field<string>;
    isValid: boolean;
    success?: string;
    submitCount: number;
};

function initialField<VALUE>(value: VALUE): Field<VALUE> {
    return {
        value,
        errors: [],
        touched: false,
        dirty: false,
    };
}

export function initialForm() {
    return {
        age: initialField(''),
        username: initialField(''),
        isValid: true,
        submitCount: 0,
    };
}

export async function submitForm(form: Form): Promise<Form> {
    await new Promise((res) => setTimeout(res, 50 + 100 * Math.random()));
    return {
        ...form,
        isValid: true,
        submitCount: form.submitCount + 1,
        success: 'successfully submitted',
    };
}

export function validateAge(age: Form['age']): Form['age'] {
    const errors = [];
    const ageAsNumber = Number(age.value);
    if (isNaN(ageAsNumber)) {
        errors.push('Age must be a number');
    }
    if (ageAsNumber < 18) {
        errors.push('Age must be greater than 18');
    }
    return { ...age, errors };
}

export function validateUsername(username: Form['username']): Form['username'] {
    const errors = [];
    if (username.value.length < 3) {
        errors.push('Username is too short (min 3 characters)');
    }
    if (username.value.length > 10) {
        errors.push('Username is too long (max 15 characters)');
    }
    return { ...username, errors };
}

export function validateForm(form: Form): Form {
    const validatedAge = validateAge(form.age);
    const validatedUsername = validateUsername(form.username);

    return {
        ...form,
        isValid: validatedAge.errors.length === 0 &&
            validatedUsername.errors.length === 0,
        age: validatedAge,
        username: validatedUsername,
    };
}

export function fromFormData(formDataBody: oak.FormDataBody): Form {
    return {
        ...initialForm(),
        age: {
            ...initialField(formDataBody.fields.age ?? ''),
            touched: true,
            dirty: true,
        },
        username: {
            ...initialField(formDataBody.fields.username ?? ''),
            touched: true,
            dirty: true,
        },
    };
}
