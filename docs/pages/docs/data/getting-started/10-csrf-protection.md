# CSRF Protection

If you have authenticated user and have them submit forms you are vulnerable to CSRF. An attacker can forge the POST request on a malicious site. When the victim visit the malicious site, its browser will send the POST request with the authentication cookie attached, and the server will execute the POST request forged by the attacker.

To mitigate CSRF vulnerability, you can do a lot of thing, like using [`SameSite` policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite) on the authentication cookie, or validating the `Referer` or `Origin` headers of any requests.

But those techniques have limits. This does not mean you should not use them, but they might not be enough to mitigate the vulnerability.

Fortunately, Frugal setup everything you might need to use [token based mitigation](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie).

## Form with CSRF protection

To protect a form, you first need to make Frugal aware that the url of the form needs protection :

```ts
//...

export const config: frugal.Config = {
    //...
    server: {
        csrf: {
            isUrlProtected(url) {
                return url.href.includes('protected');
            },
        },
    },
};
```

Then, you will need to add to your form a hidden field with name `csrfToken` containing the csrf token :

```ts
//...

export const handlers = {
    POST: async (
        request: Request,
        context: frugal.GetDynamicDataContext,
    ): Promise<frugal.DataResult<Data>> => {
        const csrfToken = context.state.csrf as string;
        //...
        return {
            data: {
                form: {
                    //...
                },
                csrfToken,
            },
        };
    },
};

export function getContent({ data }: frugal.GetContentParams<Path, Data>) {
    return `<html>
        <body>
            <form encType='multipart/form-data' method='POST'>
                <input type='hidden' name='csrftoken' value="${data.csrfToken}" />
                ${form.render(data.form)}
                <button>Submit</button>
            </form>
        </body>
    </html>`;
}
```

Now your form is protected. If a form is submitted without the token in it, the server will reject the request and answer with a 403, event if the user is authenticated.

Now the attacker can't forge a valid POST request on the malicious site, because he can't add the CSRF token.
