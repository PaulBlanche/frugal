<script lang="ts">
    import Counter from "./Counter.svelte";
    import Island from "../../src/runtime/svelte/Island.svelte";

    import { NAME } from "./Counter.script.ts";

    let { strategy, clientOnly, query, ...props } = $$props;
</script>

<Island name={NAME} component={Counter} {props} {strategy} {clientOnly} {query}>
    <slot />
</Island>
