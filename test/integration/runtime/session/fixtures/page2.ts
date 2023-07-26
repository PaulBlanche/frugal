import { RenderContext } from "../../../../../page.ts";
import "./session.script.ts";

export const pattern = "/page2";

export function render({ assets, descriptor }: RenderContext<any, any>) {
    return `<html>
    <head>
        <title>page 2</title>
        <script type="module" src="${assets["script"][descriptor]}"></script>
    </head>
    <body>
        <a href="/page1">page1</a>
    </body>
</html>`;
}
