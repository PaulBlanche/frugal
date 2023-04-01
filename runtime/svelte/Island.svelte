<script>
    import {
        START_NO_DIFF_COMMENT,
        END_NO_DIFF_COMMENT,
    } from "../../src/runtime/client_session/render/constant.ts";

    export let name;
    export let component;
    export let props;
    export let strategy = "load";
    export let query;
</script>

{@html `<!--${START_NO_DIFF_COMMENT}-->`}

<div
    data-hydratable={name}
    data-hydration-strategy={strategy}
    data-hydration-query={query}
>
    {@html `<script type="application/json">${JSON.stringify({
        props,
    })}</script>`}
    <svelte:component this={component} {...props}><slot /></svelte:component>
    <div data-svelte-slot>
        <slot />
    </div>
</div>
{@html `<!--${END_NO_DIFF_COMMENT}-->`}

<style>
    [data-svelte-slot] {
        display: none;
    }
</style>
