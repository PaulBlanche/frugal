<script lang="ts">
    import { Island } from "../../../../runtime/svelte.client.ts";
    import Dynamic from "./Dynamic.svelte";
    import { NAME } from "./DynamicIsland.script.ts";
</script>

<Island name={NAME} strategy="visible" component={Dynamic} {$$props}>
    <slot />
</Island>
