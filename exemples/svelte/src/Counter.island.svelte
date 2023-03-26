<script>
    import Counter from "./Counter.svelte";
    import Island from "./Island.svelte";

    import { NAME } from "./Counter.script.ts";
</script>

<Island name={NAME} component={Counter} props={$$props} />
