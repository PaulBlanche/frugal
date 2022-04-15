import * as oak from '../../dep/oak.ts';

export type Form = {
    value: {
        text: string;
    };
    isValid: boolean;
    errors: {
        text: string[];
    };
    success?: string;
};

export function initialForm() {
    return {
        value: {
            text: '',
        },
        isValid: true,
        errors: {
            text: [],
        },
    };
}

export async function submitForm(form: Form): Promise<Form> {
    await new Promise((res) => setTimeout(res, 50 + 100 * Math.random()));
    console.log('submit', form);
    return {
        ...form,
        success: 'successfully submitted',
    };
}

export function validateForm(form: Form): Form {
    let isValid = true;
    const textErrors = [];
    if (form.value.text.length < 3) {
        textErrors.push('Text is too short (min 3 characters)');
        isValid = false;
    }
    if (form.value.text.length > 10) {
        textErrors.push('Text is too long (max 10 characters)');
        isValid = false;
    }

    return {
        ...form,
        isValid,
        errors: {
            text: textErrors,
        },
    };
}

export function fromFormData(formDataBody: oak.FormDataBody): Form {
    return {
        value: {
            text: formDataBody.fields.text ?? '',
        },
        isValid: true,
        errors: {
            text: [],
        },
    };
}
