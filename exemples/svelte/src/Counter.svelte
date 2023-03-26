<script>
    import { count } from "./store.ts";
    export let title;

    function incrementCount() {
        count.update((count) => count + 1);
    }

    let countValue;

    count.subscribe((value) => {
        countValue = value;
    });
</script>

<div>
    <h2>{title}</h2>
    <div>value: {countValue}</div>
    <button on:click={incrementCount}>Increment</button>
</div>
