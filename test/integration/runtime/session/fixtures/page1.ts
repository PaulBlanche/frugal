import { RenderContext } from "../../../../../mod.ts";
import "./session.script.ts";

export const route = "/page1";

export function render({ assets, descriptor }: RenderContext<any, any>) {
    return `<html>
    <head>
        <title>page 1</title>
        <script type="module" src="${assets["script"][descriptor]}"></script>
    </head>
    <body>
        <a href="/page2">page2</a>
    </body>
</html>`;
}
