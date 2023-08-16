import { RenderContext } from "../../../../../mod.ts";
import "./session.script.ts";

export const route = "/page3";

export function render({ assets, descriptor }: RenderContext<any, any>) {
    return `<script type="module" src="${assets["script"][descriptor]}"></script>
<a href="/page1"><span class="nested">nested</span></a>
<a class="external" rel="external" href="/page1">external</a>
<a class="disabled" data-frugal-navigate="false" href="/page1">disabled</a>
<a class="remote-disabled" href="/page4">remote disabled</a>
`;
}
