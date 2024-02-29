<script>
    export let name;
    export let component;
    export let props;
    export let strategy = "load";
    export let query;
</script>


<div
    data-frugal-hydratable={name}
    data-frugal-hydration-strategy={strategy}
    data-frugal-hydration-query={query}
>
{@html `<script type="application/json">${JSON.stringify({ props })}</script>`}
    <svelte:component this={component} {...props}><slot /></svelte:component>
    <div data-svelte-slot>
        <slot />
    </div>
</div>

<style>
    [data-svelte-slot] {
        display: none;
    }
</style>
