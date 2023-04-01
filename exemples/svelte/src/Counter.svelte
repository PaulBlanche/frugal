<script>
    import { getData } from "frugal/runtime/svelte.client.ts";
    import { countWritable } from "./store.ts";

    const data = getData();

    function add() {
        countWritable.update((count) => count + 1);
    }
    function subtract() {
        countWritable.update((count) => count - 1);
    }

    let count;

    countWritable.subscribe((value) => {
        count = value;
    });
</script>

<div class="counter">
    <button on:click={subtract}>-</button>
    <pre>{count}</pre>
    <button on:click={add}>+</button>
</div>
<div class="counter-message">
    <slot />
    {data.framework}
</div>

<style>
    .counter {
        display: grid;
        font-size: 2em;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin-top: 2em;
        place-items: center;
        border: 1px solid grey;
    }
    .counter-message {
        text-align: center;
    }
</style>
