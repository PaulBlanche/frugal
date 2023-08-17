# Form submission

## Submitting a form

SPA frameworks have popularised the client-side form submission. When submitting a form, javascript intercepts the `submit` event and sends the payload to an API. This is powerfull for interactivity, but accessibility suffers (typically for low-capability devices).

In contrast, Frugal allows you to use native `<form>` submission :

```tsx filename=pages/post-edition.tsx
import { 
    DynamicHandlerContext, 
    DataResponse, 
    EmptyResponse, 
    RenderContext 
} from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

export const route='/post/edit/:id'

type Data = {
    title: string,
    content: string,
}

export async function GET({ path }: DynamicHandlerContext<typeof route>) {
    const post = await queryPostFromDatabase(path.id)

    if (post === undefined) {
        return new EmptyRespons({ status: 404 })
    }

    return new DataResponse<Data>(post)
}

export async function POST({ path, request }: DynamicHandlerContext<typeof route>) {
    const formData = await request.formData()

    await persistPostInDatabase({
        title: formData.get('title'),
        content: formData.get('content')
    });

    return new EmptyResponse<Data>({
        status: 303,
        headers: {
            "Location": request.url,
        },
    });
}

export function render({ data }: RenderContext<typeof route, Data>) {
    return `<!DOCTYPE html>
<html>
    <body>
        <form method="POST">
            <input type="text" name="title" value="${data.title}" />
            <textarea name="content">${data.content}</textarea>
            <button type="submit">Update</button>
        </form>
    </body>
</html>`
}
```

Here we have a `<form>` to update a post. When we arrive on the page (via a GET request), the form is prefilled with the post data.

On submission, the browser will navigate to the current URL with a POST request. The handler retrieves the post from the request, saves it in a database, and redirects the user to the same URL with a GET request.

The user ends up on the initial page, with the form prefilled with the new post data.

## Cross-page form submission

With the `action` attribute, you can submit the form to another route :

```tsx
import { RenderContext } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts";

export const route = "/post/edit/:id";

export function render({ data, path }: RenderContext<typeof route, Data>) {
    return `<!DOCTYPE html>
<html>
    <body>
        <form method="POST" action="/post/update/${path.id}">
            <input type="text" name="title" value="${data.title}" />
            <textarea name="content">${data.content}</textarea>
            <button type="submit">Update</button>
        </form>
    </body>
</html>`;
}
```

On submission, the form will be handled by the `POST` handler of the page with a route like `/post/update/:id`.

## Submit multiple forms on the same page

There are two strategies :

- send each form to a different route
- send each form with a different HTTP method
- add a flag to the form to switch between different process

The first one was already covered. The second one is technically possible, but since each HTTP method has a semantic meaning, it would be bad practice to use `DELETE` to update or create identity. This leaves us with the third method :

```tsx
import {
    DynamicHandlerContext,
    EmptyResponse,
    RenderContext,
} from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts";

export const route = "/post/edit/:id";

export async function POST({ path, request }: DynamicHandlerContext<typeof route>) {
    const formData = request.formData();
    const type = formData.get("type");
    switch (type) {
        case "update": {
            await persistPostInDatabase({
                title: formData.get("title"),
                content: formData.get("content"),
            });
            break;
        }
        case "delete": {
            await deletePostInDatabase(path.id);
        }
    }

    return new EmptyResponse<Data>({
        status: 303,
        headers: {
            "Location": request.url,
        },
    });
}

export function render({ data, path }: RenderContext<typeof route, Data>) {
    return `<!DOCTYPE html>
<html>
    <body>
        <form method="POST">
            <input type="text" name="title" value="${data.title}" />
            <textarea name="content">${data.content}</textarea>
            <button type="submit">Update</button>
        </form>
        <form method="POST">
            <button type="submit" name="type" value="delete">Delete</button>
        </form>
    </body>
</html>`;
}
```

In the `POST` handler, we either update or delete the post depending on the `type` given by the submit button.
