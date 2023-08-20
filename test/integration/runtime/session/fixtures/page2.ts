import { RenderContext } from "../../../../../mod.ts";
import "./session.script.ts";

export const route = "/page2";

export function render({ assets }: RenderContext<any, any>) {
    return `<html>
    <head>
        <title>page 2</title>
        <script type="module" src="${assets.get("script")[0]}"></script>
    </head>
    <body>
        <a href="/page1">page1</a>
    </body>
</html>`;
}
