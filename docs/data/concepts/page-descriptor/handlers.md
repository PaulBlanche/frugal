# Handlers

For a dynamic or static pages the `getStaticData`/`getDynamicData` method describes how the page should react to a `GET` request. The `handlers` object describes how the page should react to a `POST`, `PUT`, `PATCH` or `DELETE` request :

```ts
import type * as frugal from 'https://deno.land/x/frugal/packages/core/mod.ts';
import * as form from './form.ts';
//...

export function getStaticData(
    { path }: frugal.GetDataContext<Path>,
): frugal.DataResult<Data> {
    return {
        data: { foo: 'foo' },
    };
}

export const handlers = {
    POST: (request: Request) => {
        return {
            data: { foo: 'foo' },
        };
    },
};
```

## Form submission with handlers

With handlers you can do form validation and submission server side :

```ts
import type * as frugal from 'https://deno.land/x/frugal/packages/core/mod.ts';
import * as form from './form.ts';
//...

export function getStaticData(): frugal.DataResult<Data> {
    return {
        data: {
            form: form.initialForm(),
        },
    };
}

export const handlers = {
    POST: async (request: Request): Promise<frugal.DataResult<Data>> => {
        const recievedForm = form.fromFormData(await request.formData());
        const validatedForm = await form.validateForm(recievedForm);
        if (validatedForm.isValid) {
            const submittedForm = await form.submitForm(form);
            return {
                data: { form: submittedForm },
            };
        }
        return {
            data: { form: validatedForm },
        };
    },
};

export function getContent({ data }: frugal.GetContentParams<Path, Data>) {
    return `<html>
        <body>
            <form encType='multipart/form-data' method='POST'>
                ${form.render(data.form)}
                <button>Submit</button>
            </form>
        </body>
    </html>`;
}
```

When a user visit the static page, he recieve a page that was rendered with `getStaticData`. The form is in its initial state. The user fill the form and submits it. This send a `POST` request with a form-data body, that is handled by the `POST` handler. The handler get back the form from the body of the request and validates it :

- If the form is invalid, the handler sends back the validated form with maybe some error state. `getContent` generates a page with a form containing errors. The user gets back a page with the form validated.
- If the form is valid, the handler submit the form (database persistance ? Sent to an api ?). A page is generated from the submittedForm with maybe some success message. The user gets back a page with a succes message.
