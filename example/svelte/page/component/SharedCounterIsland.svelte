<script lang="ts">
    import { Island } from "../../../../runtime/svelte.client.ts";
    import SharedCounter from "./SharedCounter.svelte";
    import { NAME } from "./SharedCounterIsland.script.ts";

    const props = $$props
</script>

<Island name={NAME} component={SharedCounter} {props}>
    <slot />
</Island>
