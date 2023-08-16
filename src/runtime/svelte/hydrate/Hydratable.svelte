<script>
    export let component;
    export let props;
    export let html;
</script>

<svelte:component this={component} {...props}>{@html html}</svelte:component>
